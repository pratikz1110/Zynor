"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { getJob, deleteJob, updateJob, type Job, type JobUpdate } from "@/lib/api/jobs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const JOB_DIALOG_CLASS = "sm:max-w-[720px] max-w-[720px] w-full";

export default function JobDetailPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params?.jobId ? parseInt(params.jobId as string) : null;
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("NEW");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editCustomerId, setEditCustomerId] = useState("");
  const [editTechnicianId, setEditTechnicianId] = useState("");
  const [editError, setEditError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "MMM d, yyyy • h:mm a");
    } catch {
      return dateStr;
    }
  }

  const loadJob = useCallback(() => {
    if (!jobId) return;
    setLoading(true);
    setError(null);

    getJob(jobId)
      .then((j) => {
        setJob(j);
        // Pre-populate edit form
        setEditTitle(j.title);
        setEditDescription(j.description || "");
        setEditStatus(j.status || "NEW");
        setEditStart(j.scheduled_start_at ? j.scheduled_start_at.substring(0, 16) : "");
        setEditEnd(j.scheduled_end_at ? j.scheduled_end_at.substring(0, 16) : "");
        setEditCustomerId(String(j.customer_id));
        setEditTechnicianId(j.technician_id || "");
      })
      .catch((e) => {
        setError(e?.message ?? "Failed to load job");
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const handleEditClick = () => {
    if (!job) return;
    setIsEditOpen(true);
    setEditError("");
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) return;
    setEditError("");

    try {
      setSubmitting(true);
      const payload: JobUpdate = {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        status: editStatus.trim() || "NEW",
        scheduled_start_at: editStart ? new Date(editStart).toISOString() : null,
        scheduled_end_at: editEnd ? new Date(editEnd).toISOString() : null,
        customer_id: editCustomerId ? Number(editCustomerId) : undefined,
        technician_id: editTechnicianId.trim() ? editTechnicianId.trim() : null,
      };
      const updated = await updateJob(jobId, payload);
      setJob(updated);
      setIsEditOpen(false);
    } catch (err) {
      console.error(err);
      setEditError("Failed to update job");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!jobId || !job) return;
    if (!window.confirm("Are you sure you want to delete this job? This cannot be undone.")) {
      return;
    }
    try {
      setDeleteError(null);
      setDeleting(true);
      await deleteJob(jobId);
      router.push("/jobs");
    } catch (e: any) {
      console.error("Failed to delete job", e);
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Failed to delete job.";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="p-6">
      <div className="max-w-[700px] mx-auto mt-8 space-y-6">
        <div className="mb-2">
          <Link
            href="/jobs"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← Back to Jobs
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
          <div className="max-w-[700px] mx-auto mt-12 space-y-4">
            <p className="text-xl font-semibold text-red-700">Error loading job</p>
            <p className="text-gray-600 text-sm">{error}</p>
            <Link
              href="/jobs"
              className="inline-flex rounded-md border px-4 py-2 text-sm hover:bg-gray-100"
            >
              ← Back to Jobs
            </Link>
          </div>
        )}

        {!loading && !error && !job && (
          <div className="max-w-[700px] mx-auto mt-12 space-y-4">
            <p className="text-xl font-semibold">Job not found</p>
            <p className="text-gray-600 text-sm">
              We couldn&apos;t find a job with this ID. It may have been deleted or there was a problem loading the data.
            </p>
            <Link
              href="/jobs"
              className="inline-flex rounded-md border px-4 py-2 text-sm hover:bg-gray-100"
            >
              ← Back to Jobs
            </Link>
          </div>
        )}

        {!loading && !error && job && (
          <>
            <div>
              <h1 className="text-2xl font-semibold mb-2">Job Details</h1>
            </div>

            {/* Card: Job Information */}
            <div className="rounded-lg border p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Job Information</h2>
              <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <dt className="text-sm text-gray-500">Title</dt>
                  <dd className="mt-1 font-medium">{job.title ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <Badge
                      variant={
                        job.status === "COMPLETED" ? "success" :
                        job.status === "IN PROGRESS" ? "warning" :
                        job.status === "CANCELLED" ? "destructive" :
                        "default"
                      }
                    >
                      {job.status}
                    </Badge>
                  </dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-sm text-gray-500">Description</dt>
                  <dd className="mt-1 font-medium">{job.description ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Scheduled Start</dt>
                  <dd className="mt-1 font-medium">{formatDate(job.scheduled_start_at)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Scheduled End</dt>
                  <dd className="mt-1 font-medium">{formatDate(job.scheduled_end_at)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Customer ID</dt>
                  <dd className="mt-1 font-medium">{job.customer_id ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Technician ID</dt>
                  <dd className="mt-1 font-medium">{job.technician_id ? job.technician_id : "Unassigned"}</dd>
                </div>
              </dl>
            </div>

            {/* Card: Audit Information */}
            <div className="rounded-lg border p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Audit Information</h2>
              <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <dt className="text-sm text-gray-500">Created At</dt>
                  <dd className="mt-1 font-medium">{formatDate(job.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Updated At</dt>
                  <dd className="mt-1 font-medium">{formatDate(job.updated_at)}</dd>
                </div>
              </dl>
            </div>

            {/* Action Bar */}
            <div className="flex gap-3">
              <Link
                href="/jobs"
                className="rounded-md border px-4 py-2 hover:bg-gray-100"
              >
                Back to Jobs
              </Link>
              {jobId && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleEditClick}
                  >
                    Edit Job
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={deleting}
                    onClick={handleDelete}
                  >
                    {deleting ? "Deleting…" : "Delete Job"}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className={JOB_DIALOG_CLASS}>
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
          </DialogHeader>

          {editError && <p className="text-red-600 text-sm">{editError}</p>}

          <form onSubmit={handleUpdateJob} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                placeholder="Enter job description"
              />
            </div>

            <div>
              <Label>Status</Label>
              <Input
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              />
            </div>

            <div>
              <Label>Scheduled Start</Label>
              <Input
                type="datetime-local"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
              />
            </div>

            <div>
              <Label>Scheduled End</Label>
              <Input
                type="datetime-local"
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
              />
            </div>

            <div>
              <Label>Customer ID</Label>
              <Input
                type="number"
                value={editCustomerId}
                onChange={(e) => setEditCustomerId(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Technician ID</Label>
              <Input
                value={editTechnicianId}
                onChange={(e) => setEditTechnicianId(e.target.value)}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

