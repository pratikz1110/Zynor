"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getCustomer, updateCustomer, deleteCustomer, type Customer, type CustomerUpdate } from "@/lib/api/customers";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? parseInt(params.id) : null;
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [form, setForm] = useState<CustomerUpdate>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadCustomer = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    getCustomer(id)
      .then((c) => setCustomer(c))
      .catch((e) => setError(e?.message ?? "Failed to load customer"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  const handleEditClick = () => {
    if (!customer) return;
    setForm({
      name: customer.name ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      address: customer.address ?? "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this customer? This cannot be undone.")) {
      return;
    }
    try {
      setDeleteError(null);
      setDeleting(true);
      await deleteCustomer(id);
      router.push("/customers?success=deleted");
    } catch (e: any) {
      console.error("Failed to delete customer", e);
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Failed to delete customer.";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
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

  return (
    <main className="p-6">
      <div className="max-w-3xl mx-auto mt-8 space-y-6">
        <div className="mb-2">
          <Link
            href="/customers"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← Back to customers
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
            <p className="text-xl font-semibold text-red-700">Error loading customer</p>
            <p className="text-gray-600 text-sm">{error}</p>
            <Link
              href="/customers"
              className="inline-flex rounded-md border px-4 py-2 text-sm hover:bg-gray-100"
            >
              ← Back to customers
            </Link>
          </div>
        )}

        {!loading && !error && !customer && (
          <div className="max-w-3xl mx-auto mt-12 space-y-4">
            <p className="text-xl font-semibold">Customer not found</p>
            <p className="text-gray-600 text-sm">
              We couldn&apos;t find a customer with this ID. It may have been deleted or there was a problem loading the data.
            </p>
            <Link
              href="/customers"
              className="inline-flex rounded-md border px-4 py-2 text-sm hover:bg-gray-100"
            >
              ← Back to customers
            </Link>
          </div>
        )}

        {!loading && !error && customer && (
          <>
            {success === "updated" && (
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800">
                Customer updated successfully.
              </div>
            )}

            <div className="flex items-center gap-4">
              {/* Avatar / initials */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-semibold text-indigo-700">
                {getInitials(customer.name)}
              </div>
              {/* Name, email */}
              <div>
                <h1 className="text-2xl font-semibold">
                  {customer.name || "Unnamed Customer"}
                </h1>
                <p className="text-sm text-gray-600">{customer.email ?? "—"}</p>
              </div>
            </div>

            {/* Card: Contact Information */}
            <div className="rounded-lg border p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Contact Information</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{customer.email ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p>{customer.phone ?? "—"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p>{customer.address ?? "—"}</p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex gap-3">
              <Link
                href="/customers"
                className="rounded-md border px-4 py-2 hover:bg-gray-100"
              >
                Back
              </Link>
              {id && (
                <>
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="rounded-md border px-4 py-2 hover:bg-gray-100"
                  >
                    Edit
                  </button>
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

      {isEditOpen && customer && id && (
        <CustomerEditDialog
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          customerId={id}
          form={form}
          setForm={setForm}
          onSuccess={() => {
            setIsEditOpen(false);
            router.push(`/customers/${id}?success=updated`);
          }}
        />
      )}
    </main>
  );
}

function CustomerEditDialog({
  isOpen,
  onClose,
  customerId,
  form,
  setForm,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  customerId: number;
  form: CustomerUpdate;
  setForm: (form: CustomerUpdate) => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  }>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    // Validation
    const newErrors: typeof errors = {};
    if (form.name !== null && form.name !== undefined && !form.name.trim()) {
      newErrors.name = "Name cannot be empty.";
    }
    if (form.email && form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);

    try {
      const payload: CustomerUpdate = {
        name: form.name?.trim() || null,
        email: form.email?.trim() || null,
        phone: form.phone?.trim() || null,
        address: form.address?.trim() || null,
      };

      await updateCustomer(customerId, payload);
      onSuccess();
    } catch (error: any) {
      console.error(error);
      setFormError(error?.message ?? "Something went wrong while saving. Please try again.");
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
      <div className="relative z-50 w-full max-w-2xl mx-4 rounded-lg border bg-white p-6 shadow-lg">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Edit Customer</h2>
            <p className="text-sm text-gray-600 mt-1">
              Update customer information.
            </p>
          </div>

          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full rounded-md border px-3 py-2 ${
                  errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
                placeholder="Enter customer name"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`w-full rounded-md border px-3 py-2 ${
                  errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
                placeholder="name@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="text"
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={`w-full rounded-md border px-3 py-2 ${
                  errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
                placeholder="1234567890"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea
                value={form.address ?? ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={`w-full rounded-md border px-3 py-2 ${
                  errors.address ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
                placeholder="Enter address"
                rows={3}
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-600">{errors.address}</p>
              )}
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

