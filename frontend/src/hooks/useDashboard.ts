import { useEffect, useState } from "react";
import { getDashboard } from "../services/dashboardService";
import type { DashboardData } from "../types";
import { getErrorMessage } from "../utils/getErrorMessage";

interface DashboardResult {
  tick: number;
  data: DashboardData | null;
  error: string;
}

export function useDashboard() {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState<DashboardResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    getDashboard()
      .then((data) => {
        if (!cancelled) setResult({ tick, data, error: "" });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({
            tick,
            data: null,
            error: getErrorMessage(err, "Could not load the dashboard."),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return {
    data: result?.data ?? null,
    error: result?.error ?? "",
    loading: result?.tick !== tick,
    reload: () => setTick((value) => value + 1),
  };
}