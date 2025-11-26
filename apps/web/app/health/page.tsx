"use client";

import { useEffect, useState } from "react";
import { getHealth, type HealthResponse } from "@/lib/api/health";

export default function HealthPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHealth()
      .then((d) => setData(d))
      .catch((e) => setError(e?.message ?? "Request failed"));
  }, []);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">API Health</h1>
      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-700">
          Error: {error}
        </div>
      ) : data ? (
        <pre className="rounded-md border bg-gray-50 p-3 text-sm overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <div className="rounded-md border bg-gray-50 p-3 text-gray-600">
          Loading…
        </div>
      )}
    </main>
  );
}
















