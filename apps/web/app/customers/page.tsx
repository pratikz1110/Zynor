"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Customer, CustomerCreate, createCustomer, fetchCustomers, deleteCustomer } from "@/lib/api/customers";

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadCustomers = () => {
    setLoading(true);
    fetchCustomers()
      .then((data) => {
        setCustomers(data ?? []);
        setError(null);
      })
      .catch((e) => {
        setError(e?.message ?? "Failed to load customers");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    if (!confirm("Are you sure you want to delete this customer? This cannot be undone.")) {
      return;
    }
    try {
      setDeleteError(null);
      setDeletingId(id);
      await deleteCustomer(id);
      // Remove from local state instead of re-fetching
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      console.error("Failed to delete customer", e);
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Failed to delete customer.";
      setDeleteError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-gray-600 mt-1">
            This page will show all customer accounts for Zynor.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-md border bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50"
        >
          + Add customer
        </button>
      </div>
      
      {loading && (
        <div className="rounded-md border bg-gray-50 p-3 text-gray-700">
          Loading customers...
        </div>
      )}
      
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}
      
      {deleteError && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-700 text-sm">
          {deleteError}
        </div>
      )}

      {success === "deleted" && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          Customer deleted successfully.
        </div>
      )}

      {!loading && !error && (
        <>
          {customers.length === 0 ? (
            <div className="mt-6 text-center text-gray-600">
              No customers found.
            </div>
          ) : (
            <div className="rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Phone
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Address
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      onClick={() => router.push(`/customers/${customer.id}`)}
                      className="cursor-pointer hover:bg-gray-50 transition border-b last:border-0"
                    >
                      <td className="p-3">{customer.id}</td>
                      <td className="p-3">{customer.name ?? "—"}</td>
                      <td className="p-3">{customer.email ?? "—"}</td>
                      <td className="p-3">{customer.phone ?? "—"}</td>
                      <td className="p-3">{customer.address ?? "—"}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={(e) => handleDelete(customer.id, e)}
                          disabled={deletingId === customer.id}
                          className="rounded-md border px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {deletingId === customer.id ? "Deleting…" : "Delete"}
                        </button>
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
        <CustomerCreateDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            loadCustomers();
          }}
        />
      )}
    </main>
  );
}

function CustomerCreateDialog({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<CustomerCreate>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
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
    if (!form.name || !form.name.trim()) {
      newErrors.name = "Name is required.";
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
      const payload: CustomerCreate = {
        name: form.name.trim(),
        email: form.email?.trim() || null,
        phone: form.phone?.trim() || null,
        address: form.address?.trim() || null,
      };

      await createCustomer(payload);
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
            <h2 className="text-2xl font-semibold">New Customer</h2>
            <p className="text-sm text-gray-600 mt-1">
              Add a new customer account for Zynor.
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
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full rounded-md border px-3 py-2 ${
                  errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
                placeholder="Enter customer name"
                required
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={form.email || ""}
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
                value={form.phone || ""}
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
                value={form.address || ""}
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

