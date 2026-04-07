from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Optional


AnomalyState = Literal[
    "physical_invalid",
    "insufficient_data",
    "stable",
    "outlier",
    "warning",
    "normal",
    "invalid_input",
]


@dataclass(frozen=True)
class AnomalyDetectionResult:
    """
    이상치 탐지 결과 (z-score 기반).

    state 규칙:
    - physical_invalid: 현재값이 물리적으로 불가능한 범위(예: 음수)인 경우
    - insufficient_data: history 길이가 window_size 미만인 경우 (z-score 계산 생략)
    - stable: 최근 window의 표준편차가 매우 작아 변화가 거의 없는 안정 상태 (z-score 대체)
    - outlier: |z| > outlier_abs_z
    - warning: |z| > warning_abs_z (단, outlier 기준에는 못 미침)
    - normal: 그 외
    """

    state: AnomalyState
    window_size: int

    z_score: Optional[float] = None
    mean: Optional[float] = None
    std: Optional[float] = None

    reason: str = ""


@dataclass(frozen=True)
class AnomalyDetectionConfig:
    window_size: int = 7
    min_physical_value: float = 0.0
    std_eps: float = 1e-6
    warning_abs_z: float = 1.8
    outlier_abs_z: float = 2.5


@dataclass(frozen=True)
class ArimaForecastConfig:
    order: tuple[int, int, int] = (1, 1, 1)
    enforce_stationarity: bool = False
    enforce_invertibility: bool = False


@dataclass(frozen=True)
class ForecastResult:
    model_name: str
    horizon: int
    forecast: list[float]

