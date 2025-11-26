"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getTechnician, type Technician, deleteTechnician } from "@/lib/api/technicians";

export default function TechnicianDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [tech, setTech] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "";
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join("");
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    getTechnician(id)
      .then((t) => setTech(t))
      .catch((e) => setError(e?.message ?? "Failed to load technician"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this technician? This cannot be undone.")) {
      return;
    }
    try {
      setDeleteError(null);
      setDeleting(true);
      await deleteTechnician(id);
      router.push("/technicians?success=deleted");
    } catch (e: any) {
      console.error("Failed to delete technician", e);
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Failed to delete technician.";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="p-6">
      <div className="max-w-3xl mx-auto mt-8 space-y-6">
        <div className="mb-2">
          <Link
            href="/technicians"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← Back to technicians
          </Link>
        </div>

        {deleteError && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-700 text-sm">
            {deleteError}
          </div>
        )}

        {loading && (
          <div className="rounded-md border bg-gray-50 p-3 text-gray-700">
            Loading…
          </div>
        )}

        {error && (
          <div className="max-w-3xl mx-auto mt-12 space-y-4">
            <p className="text-xl font-semibold text-red-700">Error loading technician</p>
            <p className="text-gray-600 text-sm">
              {error}
            </p>
            <Link
              href="/technicians"
              className="inline-flex rounded-md border px-4 py-2 text-sm hover:bg-gray-100"
            >
              ← Back to technicians
            </Link>
          </div>
        )}

        {!loading && !error && !tech && (
          <div className="max-w-3xl mx-auto mt-12 space-y-4">
            <p className="text-xl font-semibold">Technician not found</p>
            <p className="text-gray-600 text-sm">
              We couldn&apos;t find a technician with this ID. It may have been deleted or there was a problem loading the data.
            </p>
            <Link
              href="/technicians"
              className="inline-flex rounded-md border px-4 py-2 text-sm hover:bg-gray-100"
            >
              ← Back to technicians
            </Link>
          </div>
        )}

        {!loading && !error && tech && (
          <>
            {success === "updated" && (
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800">
                Technician updated successfully.
              </div>
            )}

            <div className="flex items-center gap-4">
              {/* Avatar / initials */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-semibold text-indigo-700">
                {getInitials([tech.first_name, tech.last_name].filter(Boolean).join(" "))}
              </div>
              {/* Name, email, status */}
              <div>
                <h1 className="text-2xl font-semibold">
                  {[tech.first_name, tech.last_name].filter(Boolean).join(" ") || "Unnamed Technician"}
                </h1>
                <p className="text-sm text-gray-600">{tech.email ?? "—"}</p>
                <span
                  className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    tech.is_active !== false
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {tech.is_active !== false ? "Active technician" : "Inactive technician"}
                </span>
              </div>
            </div>

            {/* Card 1: Basic Information */}
            <div className="rounded-lg border p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Basic Information</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{tech.email ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p>{tech.phone ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p>{tech.is_active === false ? "Inactive" : "Active"}</p>
                </div>
              </div>
            </div>

            {/* Card 2: Skills */}
            <div className="rounded-lg border p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Skills</h2>
              <p>
                {Array.isArray(tech.skills) && tech.skills.length > 0
                  ? tech.skills.join(", ")
                  : (tech as any).skills ?? "No skills listed"}
              </p>
            </div>

            {/* Card 3: Audit Info */}
            <div className="rounded-lg border p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Audit Information</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Created at</p>
                  <p>{formatDate(tech.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Updated at</p>
                  <p>{formatDate(tech.updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex gap-3">
              <Link
                href="/technicians"
                className="rounded-md border px-4 py-2 hover:bg-gray-100"
              >
                Back
              </Link>
              {id && (
                <>
                  <Link
                    href={`/technicians/${id}/edit`}
                    className="rounded-md border px-4 py-2 hover:bg-gray-100"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    disabled={deleting}
                    className="rounded-md border px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-60"
                    onClick={handleDelete}
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

