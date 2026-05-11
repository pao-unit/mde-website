from __future__ import annotations

import os
from concurrent.futures import ThreadPoolExecutor

import numpy as np
import pandas as pd
from edmkit.metrics import mean_rho as _mean_rho
from edmkit.search import energy, neighborhood, state, strategy
from edmkit.search.dataset import Dataset, Subset
from edmkit.simplex_projection import simplex_projection
from edmkit.splits import Fold

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
    excluded = {*settings.targets, *settings.excludeColumns}
    feature_columns = [column for column in df.columns if column not in excluded]
    if len(feature_columns) == 0:
        raise RuntimeError("No candidate variables remain after exclusion")

    x = df[feature_columns].to_numpy(dtype=np.float64)
    y = df[list(settings.targets)].to_numpy(dtype=np.float64)

    library_idx = point_range_to_indices(settings.libraryRange)
    prediction_idx = point_range_to_indices(settings.predictionRange)
    holdout_idx = point_range_to_indices(settings.holdoutRange)

    # Pre-filter scans each candidate's best univariate embedding rho against
    # the targets on the training rows (library + prediction). Holdout stays
    # untouched so it remains a clean generalisation test.
    train_idx = np.concatenate([library_idx, prediction_idx])
    prefilter_result = prefilter(x, y, train_idx, settings.prefilterThreshold)

    if settings.prefilterThreshold > 0.0:
        kept = int(prefilter_result.mask.sum())
        total = len(feature_columns)
        if kept == 0:
            raise RuntimeError(
                f"Pre-filter retained 0/{total} variables at threshold="
                f"{settings.prefilterThreshold}; lower the threshold."
            )
        dropped_columns = [
            feature_columns[i]
            for i, keep in enumerate(prefilter_result.mask.tolist())
            if not keep
        ]
        feature_columns = [
            feature_columns[i]
            for i, keep in enumerate(prefilter_result.mask.tolist())
            if keep
        ]
        x = x[:, prefilter_result.mask]
        prefilter_summary: PrefilterSummary | None = PrefilterSummary(
            threshold=settings.prefilterThreshold,
            total=total,
            kept=kept,
            droppedColumns=dropped_columns,
        )
    else:
        prefilter_summary = None

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
        with ThreadPoolExecutor(
            max_workers=min(cpu_count, len(states_per_step))
        ) as pool:
            step_evaluations = list(
                pool.map(lambda selected: evaluate_holdout(library, holdout, selected), states_per_step)
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
