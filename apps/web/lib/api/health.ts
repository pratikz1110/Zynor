import api from "./client";

export type HealthResponse = { status: "ok" } | Record<string, unknown>;

/** Calls FastAPI /health and returns the JSON body. */
export async function getHealth(): Promise<HealthResponse> {
  const res = await api.get("/health");
  return res.data as HealthResponse;
}


















