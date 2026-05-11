from __future__ import annotations

import os
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass

import numpy as np
from edmkit.embedding import scan, select
from edmkit.metrics import mean_rho
from edmkit.simplex_projection import simplex_projection

# Grid for the univariate (E, tau) scan used to score each candidate variable.
PREFILTER_E_RANGE = list(range(1, 10 + 1))
PREFILTER_TAU_RANGE = list(range(1, 5 + 1))


@dataclass(frozen=True)
class PrefilterResult:
    mask: np.ndarray  # shape (n_features,), bool
    scores: np.ndarray  # shape (n_features,), float


def prefilter(
    x: np.ndarray,
    y: np.ndarray,
    train_idx: np.ndarray,
    threshold: float,
) -> PrefilterResult:
    """Score each feature by its best univariate embedding rho on the training rows.

    For each column of ``x``, runs an (E, tau) grid scan against ``y`` restricted
    to ``train_idx`` and records the best mean rho across folds. Features whose
    best mean rho is below ``threshold`` are masked out.

    ``threshold == 0.0`` skips the scan and returns an all-true mask so callers
    can opt out without paying the cost.
    """
    n_features = x.shape[1]
    if threshold <= 0.0:
        return PrefilterResult(
            mask=np.ones(n_features, dtype=bool),
            scores=np.full(n_features, np.nan, dtype=np.float64),
        )

    x_train = x[train_idx]
    y_train = y[train_idx]

    def best_rho(i: int) -> float:
        return float(
            select(
                scan(
                    x_train[:, i],
                    y_train,
                    E=PREFILTER_E_RANGE,
                    tau=PREFILTER_TAU_RANGE,
                    predict=simplex_projection,
                    metric=mean_rho,
                ),
                E=PREFILTER_E_RANGE,
                tau=PREFILTER_TAU_RANGE,
            )[2]
        )

    max_workers = max(1, min(os.cpu_count() or 1, n_features))
    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        scores = np.fromiter(
            pool.map(best_rho, range(n_features)),
            dtype=np.float64,
            count=n_features,
        )

    mask = scores >= threshold
    return PrefilterResult(mask=mask, scores=scores)
