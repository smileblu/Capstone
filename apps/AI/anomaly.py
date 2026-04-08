from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterable, Sequence

import numpy as np

from anomaly_types import (
    AnomalyDetectionConfig,
    AnomalyDetectionResult,
    AnomalyState,
)


def _to_1d_float_array(values: Sequence[float] | Iterable[float]) -> np.ndarray:
    arr = np.asarray(list(values), dtype=np.float64).reshape(-1)
    return arr


class AnomalyDetector(ABC):
    @abstractmethod
    def detect(self, *, history: Sequence[float], current: float) -> AnomalyDetectionResult:
        raise NotImplementedError


class ZScoreRollingAnomalyDetector(AnomalyDetector):
    def __init__(self, config: AnomalyDetectionConfig | None = None):
        self._config = config or AnomalyDetectionConfig()

    def detect(self, *, history: Sequence[float], current: float) -> AnomalyDetectionResult:
        cfg = self._config
        return detect_anomaly_zscore(
            history=history,
            current=current,
            window_size=cfg.window_size,
            min_physical_value=cfg.min_physical_value,
            std_eps=cfg.std_eps,
            warning_abs_z=cfg.warning_abs_z,
            outlier_abs_z=cfg.outlier_abs_z,
        )


def detect_anomaly_zscore(
    *,
    history: Sequence[float],
    current: float,
    window_size: int = 7,
    min_physical_value: float = 0.0,
    std_eps: float = 1e-6,
    warning_abs_z: float = 1.8,
    outlier_abs_z: float = 2.5,
) -> AnomalyDetectionResult:
    if window_size <= 1:
        return AnomalyDetectionResult(
            state="invalid_input",
            window_size=max(0, window_size),
            reason="window_size must be >= 2",
        )

    try:
        current_f = float(current)
    except (TypeError, ValueError):
        return AnomalyDetectionResult(
            state="invalid_input",
            window_size=0,
            reason="current must be a finite number",
        )

    if not np.isfinite(current_f):
        return AnomalyDetectionResult(
            state="invalid_input",
            window_size=0,
            reason="current must be finite",
        )

    if current_f < min_physical_value:
        return AnomalyDetectionResult(
            state="physical_invalid",
            window_size=min(window_size, len(history)),
            reason=f"current ({current_f}) < min_physical_value ({min_physical_value})",
        )

    history_arr = _to_1d_float_array(history)
    if history_arr.size < window_size:
        return AnomalyDetectionResult(
            state="insufficient_data",
            window_size=history_arr.size,
            reason=f"history size ({history_arr.size}) < window_size ({window_size})",
        )

    window = history_arr[-window_size:]
    mean = float(np.mean(window))
    std = float(np.std(window, ddof=0))

    if std <= std_eps:
        return AnomalyDetectionResult(
            state="stable",
            window_size=window_size,
            mean=mean,
            std=std,
            reason="std is too small; treat as stable pattern",
        )

    z = (current_f - mean) / std
    abs_z = abs(z)

    state: AnomalyState
    if abs_z > outlier_abs_z:
        state = "outlier"
    elif abs_z > warning_abs_z:
        state = "warning"
    else:
        state = "normal"

    return AnomalyDetectionResult(
        state=state,
        window_size=window_size,
        z_score=float(z),
        mean=mean,
        std=std,
    )
