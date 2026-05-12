from __future__ import annotations

import os
from concurrent.futures import ThreadPoolExecutor
from typing import Any

import numpy as np
import pandas as pd
from dimx import MDE
from edmkit.metrics import mean_rho as _mean_rho
from edmkit.search import energy, neighborhood, state, strategy
from edmkit.search.dataset import Dataset, Subset
from edmkit.simplex_projection import simplex_projection
from edmkit.splits import Fold
from pyEDM import ComputeError, Simplex

from app.analysis.prefilter import prefilter
from app.domain.models import (
    AnalysisSettings,
    BestStep,
    FoldSummary,
    PointRange,
    PrefilterSummary,
    Result,
    SelectionStep,
    TargetPlot,
)


def run_analysis(df: pd.DataFrame, settings: AnalysisSettings) -> Result:
    if settings.backend == "dimx":
        return run_dimx_analysis(df, settings)
    return run_edmkit_analysis(df, settings)


def run_edmkit_analysis(df: pd.DataFrame, settings: AnalysisSettings) -> Result:
    excluded = {*settings.targets, *settings.excludeColumns}
    feature_columns = [column for column in df.columns if column not in excluded]
    if len(feature_columns) == 0:
        raise RuntimeError("No candidate variables remain after exclusion")

    x = df[feature_columns].to_numpy(dtype=np.float64)
    y = df[list(settings.targets)].to_numpy(dtype=np.float64)

    library_idx = point_range_to_indices(settings.libraryRange)
    prediction_idx = point_range_to_indices(settings.predictionRange)
    holdout_idx = point_range_to_indices(settings.holdoutRange)

    train_idx = np.concatenate([library_idx, prediction_idx])
    feature_columns, x, prefilter_summary = apply_prefilter(
        feature_columns, x, y, train_idx, settings.prefilterThreshold
    )

    dataset = Dataset(X=x, Y=y)
    library = Subset(dataset, library_idx)
    holdout = Subset(dataset, holdout_idx)

    # Greedy selection scores each candidate on the prediction range while the
    # library range remains the simplex library. Holdout is only used below for
    # final per-step evaluation and plotting.
    combined_idx = np.concatenate([library_idx, prediction_idx])
    combined = Subset(dataset, combined_idx)
    energy_function = energy.holdout(
        data=combined,
        fold=Fold(
            train=np.arange(len(library_idx), dtype=np.int64),
            validation=np.arange(len(library_idx), len(combined_idx), dtype=np.int64),
        ),
        predict=simplex_projection,
        metric=energy_metric,
    )
    neighbors = neighborhood.forward(x.shape[1])
    step = strategy.greedy(energy_function, neighbors)
    initial = strategy.Frontier(
        states=state.initial(),
        contexts=energy_function.initial(),
        energies=np.array([float("inf")], dtype=np.float64),
    )

    rng = np.random.default_rng(settings.seed)
    max_steps = min(settings.maxVariables, x.shape[1])
    trace = list(strategy.run(initial, step, max_steps=max_steps, rng=rng))

    states_per_step = [frontier.states[0] for frontier in trace]
    if states_per_step:
        cpu_count = os.cpu_count() or 1
        with ThreadPoolExecutor(max_workers=min(cpu_count, len(states_per_step))) as pool:
            step_evaluations = list(
                pool.map(
                    lambda selected: evaluate_holdout(library, holdout, selected), states_per_step
                )
            )
    else:
        step_evaluations = []

    steps = [
        SelectionStep(
            variable=feature_columns[int(frontier.states[0, -1])],
            rhoPrediction=1.0 - float(frontier.energies[0]),
            rhoHoldout=step_evaluations[index][1],
        )
        for index, frontier in enumerate(trace)
    ]

    best_step = build_best_step(settings, holdout, steps, step_evaluations)
    fold = FoldSummary(
        librarySize=int(len(library_idx)),
        predictionSize=int(len(prediction_idx)),
        holdoutSize=int(len(holdout_idx)),
    )

    return Result(steps=steps, bestStep=best_step, fold=fold, prefilter=prefilter_summary)


def run_dimx_analysis(df: pd.DataFrame, settings: AnalysisSettings) -> Result:
    if len(settings.targets) != 1:
        raise RuntimeError("dimx backend supports exactly one target column")

    excluded = {*settings.targets, *settings.excludeColumns}
    feature_columns = [column for column in df.columns if column not in excluded]
    if len(feature_columns) == 0:
        raise RuntimeError("No candidate variables remain after exclusion")

    library_idx = point_range_to_indices(settings.libraryRange)
    prediction_idx = point_range_to_indices(settings.predictionRange)
    holdout_idx = point_range_to_indices(settings.holdoutRange)
    train_idx = np.concatenate([library_idx, prediction_idx])

    x = df[feature_columns].to_numpy(dtype=np.float64)
    y = df[[settings.targets[0]]].to_numpy(dtype=np.float64)
    feature_columns, _x, prefilter_summary = apply_prefilter(
        feature_columns, x, y, train_idx, settings.prefilterThreshold
    )

    library_range = point_range_to_dimx_range(settings.libraryRange)
    prediction_range = point_range_to_dimx_range(settings.predictionRange)
    holdout_range = point_range_to_dimx_range(settings.holdoutRange)

    remove_columns = [*settings.targets, *settings.excludeColumns]
    if prefilter_summary is not None:
        remove_columns.extend(prefilter_summary.droppedColumns)
    remove_columns = list(dict.fromkeys(remove_columns))

    mde = MDE(
        dataFrame=df,
        removeColumns=remove_columns,
        D=min(settings.maxVariables, len(feature_columns)),
        target=settings.targets[0],
        lib=library_range,
        pred=prediction_range,
        Tp=0,
        noTime=True,
        noCCM=True,
        ccmSeed=settings.seed,
        crossMapRhoMin=0,
        cores=os.cpu_count(),
        consoleOut=False,
        verbose=False,
        debug=False,
    )
    mde.Run()

    steps: list[SelectionStep] = []
    step_evaluations: list[tuple[np.ndarray, np.ndarray, float]] = []
    selected: list[str] = []
    mde_out = mde.MDEOut
    if mde_out is not None and not mde_out.empty:
        for variable_value, rho_value in zip(mde_out["variables"], mde_out["rho"]):
            variable = normalize_dimx_variable(variable_value)
            if variable not in feature_columns:
                continue

            selected.append(variable)
            observed, predicted, holdout_rho = evaluate_dimx_holdout(
                df,
                selected,
                settings.targets[0],
                library_range,
                holdout_range,
            )
            step_evaluations.append((observed, predicted, holdout_rho))
            steps.append(
                SelectionStep(
                    variable=variable,
                    rhoPrediction=coerce_metric(rho_value),
                    rhoHoldout=holdout_rho,
                )
            )

    best_step = build_dimx_best_step(settings, steps, step_evaluations)
    fold = FoldSummary(
        librarySize=int(len(library_idx)),
        predictionSize=int(len(prediction_idx)),
        holdoutSize=int(len(holdout_idx)),
    )

    return Result(steps=steps, bestStep=best_step, fold=fold, prefilter=prefilter_summary)


def apply_prefilter(
    feature_columns: list[str],
    x: np.ndarray,
    y: np.ndarray,
    train_idx: np.ndarray,
    threshold: float,
) -> tuple[list[str], np.ndarray, PrefilterSummary | None]:
    if threshold <= 0.0:
        return feature_columns, x, None

    prefilter_result = prefilter(x, y, train_idx, threshold)

    kept = int(prefilter_result.mask.sum())
    total = len(feature_columns)
    if kept == 0:
        raise RuntimeError(
            f"Pre-filter retained 0/{total} variables at threshold="
            f"{threshold}; lower the threshold."
        )
    dropped_columns = [
        feature_columns[i] for i, keep in enumerate(prefilter_result.mask.tolist()) if not keep
    ]
    kept_columns = [
        feature_columns[i] for i, keep in enumerate(prefilter_result.mask.tolist()) if keep
    ]
    summary = PrefilterSummary(
        threshold=threshold,
        total=total,
        kept=kept,
        droppedColumns=dropped_columns,
    )
    return kept_columns, x[:, prefilter_result.mask], summary


def point_range_to_dimx_range(point_range: PointRange) -> list[int]:
    return [point_range.start, point_range.end]


def evaluate_dimx_holdout(
    df: pd.DataFrame,
    selected: list[str],
    target: str,
    library_range: list[int],
    holdout_range: list[int],
) -> tuple[np.ndarray, np.ndarray, float]:

    prediction = Simplex(
        dataFrame=df,
        target=target,
        columns=selected,
        lib=library_range,
        pred=holdout_range,
        E=0,
        Tp=0,
        tau=-1,
        embedded=True,
        noTime=True,
        showPlot=False,
    )
    observed = prediction["Observations"].to_numpy(dtype=np.float64).reshape(-1, 1)
    predicted = prediction["Predictions"].to_numpy(dtype=np.float64).reshape(-1, 1)

    finite = np.isfinite(observed[:, 0]) & np.isfinite(predicted[:, 0])
    if not finite.any():
        raise RuntimeError("dimx holdout evaluation produced no finite predictions")

    error = ComputeError(observed[finite, 0], predicted[finite, 0])
    rho = coerce_metric(error["rho"])
    return observed, np.nan_to_num(predicted), rho


def build_dimx_best_step(
    settings: AnalysisSettings,
    steps: list[SelectionStep],
    step_evaluations: list[tuple[np.ndarray, np.ndarray, float]],
) -> BestStep | None:
    if not steps:
        return None

    best_index = max(range(len(steps)), key=lambda index: steps[index].rhoPrediction)
    observed, predicted, _rho = step_evaluations[best_index]
    plots = [
        TargetPlot(
            name=settings.targets[0],
            observed=observed[:, 0].tolist(),
            predicted=predicted[:, 0].tolist(),
        )
    ]

    return BestStep(
        stepIndex=best_index + 1,
        rho=steps[best_index].rhoHoldout,
        rhoPrediction=steps[best_index].rhoPrediction,
        rhoHoldout=steps[best_index].rhoHoldout,
        plots=plots,
    )


def normalize_dimx_variable(value: object) -> str:
    if isinstance(value, list):
        return str(value[0]) if value else ""
    return str(value)


def coerce_metric(value: Any) -> float:
    metric = float(value)
    if not np.isfinite(metric):
        return 0.0
    return metric


def point_range_to_indices(point_range: PointRange) -> np.ndarray:
    return np.arange(point_range.start - 1, point_range.end, dtype=np.int64)


def energy_metric(predicted: np.ndarray, observed: np.ndarray) -> np.ndarray:
    return 1.0 - _mean_rho(predicted.reshape(observed.shape), observed)


def evaluate_holdout(
    library: Subset, holdout: Subset, states: np.ndarray
) -> tuple[np.ndarray, float]:
    selected = states.astype(np.intp)
    predicted = simplex_projection(
        library.X[:, selected],
        library.Y,
        holdout.X[:, selected],
    ).reshape(holdout.Y.shape)
    rho = float(_mean_rho(predicted, holdout.Y))
    return predicted, rho


def build_best_step(
    settings: AnalysisSettings,
    holdout: Subset,
    steps: list[SelectionStep],
    step_evaluations: list[tuple[np.ndarray, float]],
) -> BestStep | None:
    if not steps:
        return None

    best_index = max(range(len(steps)), key=lambda index: steps[index].rhoPrediction)
    best_prediction = step_evaluations[best_index][0]
    observed = np.asarray(holdout.Y, dtype=np.float64)
    predicted = np.asarray(best_prediction, dtype=np.float64)
    plots = [
        TargetPlot(
            name=settings.targets[target_index],
            observed=observed[:, target_index].tolist(),
            predicted=predicted[:, target_index].tolist(),
        )
        for target_index in range(len(settings.targets))
    ]

    return BestStep(
        stepIndex=best_index + 1,
        rho=steps[best_index].rhoHoldout,
        rhoPrediction=steps[best_index].rhoPrediction,
        rhoHoldout=steps[best_index].rhoHoldout,
        plots=plots,
    )
