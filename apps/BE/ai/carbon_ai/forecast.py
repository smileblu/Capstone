from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Literal, Sequence

import numpy as np

from .types import ArimaForecastConfig, ForecastResult


ForecasterName = Literal["arima"]


class TimeSeriesForecaster(ABC):
    @abstractmethod
    def forecast(self, history: Sequence[float], horizon: int) -> ForecastResult:  # pragma: no cover
        raise NotImplementedError


class ArimaForecaster(TimeSeriesForecaster):
    def __init__(self, config: ArimaForecastConfig | None = None):
        self._config = config or ArimaForecastConfig()

    def forecast(self, history: Sequence[float], horizon: int) -> ForecastResult:
        """
        ARIMA 기반 시계열 예측.

        - history: 과거 값 (월별 배출량 등)
        - horizon: 앞으로 예측할 개월 수 (steps)
        """
        if horizon <= 0:
            raise ValueError("horizon must be a positive integer")

        series = np.asarray(list(history), dtype=np.float64).reshape(-1)
        if series.size < 3:
            raise ValueError("history must contain at least 3 points for ARIMA")

        try:
            from statsmodels.tsa.arima.model import ARIMA
        except ImportError as e:
            raise ImportError(
                "statsmodels is required for ARIMA forecasting. Please install it."
            ) from e

        cfg = self._config

        # ARIMA는 series 자체를 endog로 받는다.
        model = ARIMA(
            series,
            order=cfg.order,
            enforce_stationarity=cfg.enforce_stationarity,
            enforce_invertibility=cfg.enforce_invertibility,
        )
        fit = model.fit()
        pred = fit.forecast(steps=horizon)

        forecast_list = [float(x) for x in np.asarray(pred).reshape(-1)]
        return ForecastResult(
            model_name="arima",
            horizon=horizon,
            forecast=forecast_list,
        )


def get_forecaster(name: ForecasterName, config: ArimaForecastConfig | None = None) -> TimeSeriesForecaster:
    """
    모델 교체를 위한 factory.

    이후 prophet/lstm 등을 추가하면 여기만 확장하면 된다.
    """
    if name == "arima":
        return ArimaForecaster(config=config)
    raise ValueError(f"Unknown forecaster name: {name}")


def example_usage() -> None:
    history = [10.0, 11.2, 10.7, 11.5, 12.0, 11.9, 12.2]
    forecaster = get_forecaster("arima", config=ArimaForecastConfig(order=(1, 1, 1)))
    res = forecaster.forecast(history=history, horizon=3)
    print("forecast:", res.forecast)


if __name__ == "__main__":
    example_usage()

