"use client";

import { useEffect, useState } from "react";

export default function HealthBadge() {
  const [status, setStatus] = useState<"checking" | "up" | "down">("checking");

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL;
    let cancelled = false;

    async function ping() {
      try {
        const res = await fetch(`${API}/health`, { cache: "no-store" });
        if (!cancelled) setStatus(res.ok ? "up" : "down");
      } catch {
        if (!cancelled) setStatus("down");
      }
    }

    ping();
    const id = setInterval(ping, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const label =
    status === "checking" ? "Checking…" : status === "up" ? "Up" : "Down";

  return (
    <span
      className={`rounded-md px-2 py-1 text-xs border ${
        status === "up"
          ? "border-green-300 bg-green-50 text-green-700"
          : status === "down"
          ? "border-red-300 bg-red-50 text-red-700"
          : "border-gray-300 bg-gray-50 text-gray-700"
      }`}
      title="API health"
    >
      API: {label}
    </span>
  );
}
