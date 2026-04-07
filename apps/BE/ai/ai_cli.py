from __future__ import annotations

import json
import sys
from typing import Any, Dict, Literal

Task = Literal["anomaly", "forecast"]


def _read_stdin_json() -> Dict[str, Any]:
    raw = sys.stdin.read()
    if not raw.strip():
        raise ValueError("stdin is empty; expected JSON payload")
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError("input JSON must be an object")
    return data


def _handle_anomaly(params: Dict[str, Any]) -> Dict[str, Any]:
    try:
        from carbon_ai.anomaly import detect_anomaly_zscore
    except ModuleNotFoundError as e:
        raise ModuleNotFoundError(
            "Missing Python dependencies for anomaly detection. "
            "Please install requirements_ai.txt"
        ) from e

    # 필수
    history = params.get("history")
    current = params.get("current")

    if history is None or current is None:
        raise ValueError("anomaly task requires 'history' and 'current'")

    window_size = int(params.get("window_size", 7))
    min_physical_value = float(params.get("min_physical_value", 0.0))
    std_eps = float(params.get("std_eps", 1e-6))
    warning_abs_z = float(params.get("warning_abs_z", 1.8))
    outlier_abs_z = float(params.get("outlier_abs_z", 2.5))

    result = detect_anomaly_zscore(
        history=history,
        current=current,
        window_size=window_size,
        min_physical_value=min_physical_value,
        std_eps=std_eps,
        warning_abs_z=warning_abs_z,
        outlier_abs_z=outlier_abs_z,
    )
    return {
        "task": "anomaly",
        "result": {
            "state": result.state,
            "window_size": result.window_size,
            "z_score": result.z_score,
            "mean": result.mean,
            "std": result.std,
            "reason": result.reason,
        },
    }


def _handle_forecast(params: Dict[str, Any]) -> Dict[str, Any]:
    try:
        import numpy as np
        from carbon_ai.forecast import get_forecaster
        from carbon_ai.types import ArimaForecastConfig
    except ModuleNotFoundError as e:
        raise ModuleNotFoundError(
            "Missing Python dependencies for forecasting. "
            "Please install requirements_ai.txt"
        ) from e

    history = params.get("history")
    horizon = params.get("horizon")
    model = params.get("model", "arima")

    if history is None or horizon is None:
        raise ValueError("forecast task requires 'history' and 'horizon'")

    horizon_i = int(horizon)
    series = np.asarray(list(history), dtype=np.float64).reshape(-1)
    if series.size == 0:
        raise ValueError("history must not be empty")

    order = params.get("order", [1, 1, 1])
    order_t = tuple(int(x) for x in order)

    forecaster = get_forecaster(
        model,
        config=ArimaForecastConfig(order=order_t),
    )
    result = forecaster.forecast(history=series, horizon=horizon_i)

    return {
        "task": "forecast",
        "result": {
            "model_name": result.model_name,
            "horizon": result.horizon,
            "forecast": result.forecast,
        },
    }


def main() -> None:
    payload = _read_stdin_json()

    task: Task = payload.get("task")
    params = payload.get("params", {})

    try:
        if task == "anomaly":
            out = _handle_anomaly(params)
        elif task == "forecast":
            out = _handle_forecast(params)
        else:
            raise ValueError(f"Unknown task: {task}")
    except Exception as e:
        # Java/서버에서 파싱하기 쉬운 형태로 에러도 JSON으로 내려준다.
        out = {
            "task": task,
            "error": {
                "type": type(e).__name__,
                "message": str(e),
            },
        }

    json.dump(out, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()

