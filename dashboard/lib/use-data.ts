"use client";

import { useState, useEffect } from "react";
import {
  incidents as mockIncidents,
  agents as mockAgents,
  getStats as getMockStats,
} from "./mock-data";

type FetchState<T> = { data: T; source: "db" | "mock"; loading: boolean };

function useFetchWithFallback<T>(url: string, fallback: T): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: fallback,
    source: "mock",
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("api_error");
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data && !data.error) {
          const resolved = Array.isArray(data) ? data : data;
          if (Array.isArray(resolved) && resolved.length === 0) throw new Error("empty");
          setState({ data: resolved as T, source: "db", loading: false });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ data: fallback, source: "mock", loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}

export function useIncidents() {
  return useFetchWithFallback("/api/incidents", mockIncidents);
}

export function useIncident(id: string) {
  const fallback = mockIncidents.find((i) => i.id === id) || null;
  return useFetchWithFallback(`/api/incidents/${id}`, fallback);
}

export function useStats() {
  return useFetchWithFallback("/api/stats", getMockStats());
}

export function useAgents() {
  return useFetchWithFallback("/api/agents", mockAgents);
}
