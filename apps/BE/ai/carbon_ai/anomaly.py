from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterable, Sequence

import numpy as np

from .types import (
    AnomalyDetectionConfig,
    AnomalyDetectionResult,
    AnomalyState,
)


def _to_1d_float_array(values: Sequence[float] | Iterable[float]) -> np.ndarray:
    arr = np.asarray(list(values), dtype=np.float64).reshape(-1)
    return arr


class AnomalyDetector(ABC):
    @abstractmethod
    def detect(self, *, history: Sequence[float], current: float) -> AnomalyDetectionResult:  # pragma: no cover
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
    """
    개인별 최근 행동 패턴(rolling window) 기준 이상치 탐지.

    입력 규칙:
    - history: "과거 값들" (current는 별도 인자로 제공)
    - current: "새로 들어온 값"

    동작 규칙:
    1) physical check: current < min_physical_value 이면 physical_invalid
    2) 데이터 부족: history 길이가 window_size 미만이면 insufficient_data
    3) rolling window: history의 마지막 window_size 값을 사용해 mean/std 계산
    4) std 안정성: std <= std_eps 이면 stable 반환
    5) z-score: z = (current - mean) / std
       - |z| > outlier_abs_z => outlier
       - |z| > warning_abs_z => warning
       - else normal

    반환:
    - state + window_size + z_score/mean/std(가능한 경우)
    """

    # 0) 입력 방어 로직
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

    # 1) physical invalid check
    if current_f < min_physical_value:
        return AnomalyDetectionResult(
            state="physical_invalid",
            window_size=min(window_size, len(history)),
            reason=f"current ({current_f}) < min_physical_value ({min_physical_value})",
        )

    # 2) history 부족 체크
    history_arr = _to_1d_float_array(history)
    if history_arr.size < window_size:
        return AnomalyDetectionResult(
            state="insufficient_data",
            window_size=history_arr.size,
            reason=f"history size ({history_arr.size}) < window_size ({window_size})",
        )

    # 3) rolling window
    window = history_arr[-window_size:]

    mean = float(np.mean(window))
    std = float(np.std(window, ddof=0))

    # 4) std 매우 작으면 stable 처리
    if std <= std_eps:
        return AnomalyDetectionResult(
            state="stable",
            window_size=window_size,
            mean=mean,
            std=std,
            reason="std is too small; treat as stable pattern",
        )

    # 5) z-score 계산 및 상태 분류
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


def example_usage() -> None:
    """
    간단 사용 예시.

    - history(7개 이상) 존재 + 음수 current => physical_invalid
    - history 충분 + std 작음 => stable
    - history 충분 + |z| 크면 outlier/warning
    """

    # 1) insufficient_data
    res1 = detect_anomaly_zscore(history=[1.0, 1.1, 1.2], current=1.5)
    print("res1:", res1)

    # 2) physical_invalid
    res2 = detect_anomaly_zscore(history=[1.0] * 7, current=-0.1, min_physical_value=0.0)
    print("res2:", res2)

    # 3) stable (std ~= 0)
    res3 = detect_anomaly_zscore(history=[2.0] * 7, current=2.01, std_eps=1e-6)
    print("res3:", res3)

    # 4) outlier
    history = [10.0, 10.2, 9.9, 10.1, 10.05, 10.0, 10.2]
    res4 = detect_anomaly_zscore(history=history, current=13.0, window_size=7)
    print("res4:", res4)


if __name__ == "__main__":
    example_usage()

