"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Job, JobCreate, JobUpdate, createJob, fetchJobs, updateJob, deleteJob } from "@/lib/api/jobs";
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

const JOB_DIALOG_CLASS = "sm:max-w-[720px] max-w-[720px] w-full";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editJobId, setEditJobId] = useState<number | null>(null);
  // form fields for editing a job:
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("NEW");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editCustomerId, setEditCustomerId] = useState("");
  const [editTechnicianId, setEditTechnicianId] = useState("");
  const [editError, setEditError] = useState("");

  const loadJobs = () => {
    setLoading(true);
    fetchJobs()
      .then((data) => {
        setJobs(data ?? []);
        setError(null);
      })
      .catch((e) => {
        setError(e?.message ?? "Failed to load jobs");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const handleEditJob = (job: Job) => {
    setEditJobId(job.id);
    setEditTitle(job.title);
    setEditDescription(job.description || "");
    setEditStatus(job.status || "NEW");
    setEditStart(job.scheduled_start_at ? job.scheduled_start_at.substring(0, 16) : "");
    setEditEnd(job.scheduled_end_at ? job.scheduled_end_at.substring(0, 16) : "");
    setEditCustomerId(String(job.customer_id));
    setEditTechnicianId(job.technician_id || "");
    setEditError("");
    setIsEditOpen(true);
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!window.confirm("Are you sure you want to delete this job?")) {
      return;
    }
    try {
      setIsDeleteLoading(true);
      await deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete job");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");

    try {
      const payload: JobUpdate = {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        status: editStatus.trim() || "NEW",
        scheduled_start_at: editStart ? new Date(editStart).toISOString() : null,
        scheduled_end_at: editEnd ? new Date(editEnd).toISOString() : null,
        customer_id: editCustomerId ? Number(editCustomerId) : undefined,
        technician_id: editTechnicianId.trim() ? editTechnicianId.trim() : null,
      };
      const updated = await updateJob(editJobId!, payload);
      // Replace in jobs list
      setJobs((prev) =>
        prev.map((j) => (j.id === updated.id ? updated : j))
      );
      setIsEditOpen(false);
    } catch (err) {
      console.error(err);
      setEditError("Failed to update job");
    }
  };

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="text-sm text-gray-600 mt-1">
            This page will show all scheduled and completed jobs in Zynor.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-md border bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50"
        >
          + New Job
        </button>
      </div>

      {loading && (
        <div className="rounded-md border bg-gray-50 p-3 text-gray-700">
          Loading jobs...
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {jobs.length === 0 ? (
            <div className="mt-6 text-center text-gray-600">
              No jobs found.
            </div>
          ) : (
            <div className="rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Title
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Scheduled Start
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Scheduled End
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Customer ID
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr
                      key={job.id}
                      className="hover:bg-gray-50 transition border-b last:border-0"
                    >
                      <td className="p-3">{job.id}</td>
                      <td className="p-3">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {job.title ?? "—"}
                        </Link>
                      </td>
                      <td className="p-3">{job.status ?? "—"}</td>
                      <td className="p-3">{formatDate(job.scheduled_start_at)}</td>
                      <td className="p-3">{formatDate(job.scheduled_end_at)}</td>
                      <td className="p-3">{job.customer_id ?? "—"}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditJob(job)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteJob(job.id)}
                            disabled={isDeleteLoading}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {isCreateOpen && (
        <JobCreateDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          setJobs={setJobs}
          onSuccess={() => {
            setIsCreateOpen(false);
          }}
        />
      )}

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

            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function JobCreateDialog({
  isOpen,
  onClose,
  onSuccess,
  setJobs,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
}) {
  const [form, setForm] = useState<{
    title: string;
    description: string;
    status: string;
    scheduledStart: string;
    scheduledEnd: string;
    customerId: string;
    technicianId: string;
  }>({
    title: "",
    description: "",
    status: "NEW",
    scheduledStart: "",
    scheduledEnd: "",
    customerId: "",
    technicianId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    title?: string;
    customerId?: string;
  }>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    // Validation
    const newErrors: typeof errors = {};
    if (!form.title || !form.title.trim()) {
      newErrors.title = "Title is required.";
    }
    if (!form.customerId || !form.customerId.trim()) {
      newErrors.customerId = "Customer ID is required.";
    }
    const customerIdNum = Number(form.customerId);
    if (form.customerId && (isNaN(customerIdNum) || customerIdNum <= 0)) {
      newErrors.customerId = "Customer ID must be a valid positive number.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);

    try {
      const payload: JobCreate = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status.trim() || "NEW",
        scheduled_start_at: form.scheduledStart
          ? new Date(form.scheduledStart).toISOString()
          : null,
        scheduled_end_at: form.scheduledEnd
          ? new Date(form.scheduledEnd).toISOString()
          : null,
        customer_id: Number(form.customerId),
        technician_id: form.technicianId.trim() ? form.technicianId.trim() : null,
      };

      const newJob = await createJob(payload);
      // After success, refresh the list the same way you do for customers
      setJobs((prev) => [...prev, newJob]);
      // Close the modal and optionally reset form fields
      onSuccess();
    } catch (err) {
      console.error(err);
      setFormError("Failed to create job");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className={`relative z-50 ${JOB_DIALOG_CLASS} mx-4 rounded-lg border bg-white p-6 shadow-lg`}>
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">New Job</h2>
            <p className="text-sm text-gray-600 mt-1">
              Add a new job for Zynor.
            </p>
          </div>

          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={`w-full rounded-md border px-3 py-2 ${
                  errors.title ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
                placeholder="Enter job title"
                required
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-600">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                placeholder="Enter job description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <input
                type="text"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="NEW"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Scheduled Start</label>
              <input
                type="datetime-local"
                value={form.scheduledStart}
                onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Scheduled End</label>
              <input
                type="datetime-local"
                value={form.scheduledEnd}
                onChange={(e) => setForm({ ...form, scheduledEnd: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Customer ID <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className={`w-full rounded-md border px-3 py-2 ${
                  errors.customerId ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
                placeholder="Enter customer ID"
                required
              />
              {errors.customerId && (
                <p className="mt-1 text-xs text-red-600">{errors.customerId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Technician ID</label>
              <input
                type="text"
                value={form.technicianId || ""}
                onChange={(e) => setForm({ ...form, technicianId: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Enter technician ID (UUID)"
              />
            </div>

            <div className="pt-4 flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border px-4 py-2 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md border px-4 py-2 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed bg-gray-900 text-white hover:bg-gray-800"
              >
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

