"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { listTechnicians, type Technician } from "@/lib/api/technicians";
export default function TechniciansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const [items, setItems] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortField, setSortField] = useState<
    "name" | "email" | "phone" | "skill" | "active" | ""
  >("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: "name" | "email" | "phone" | "skill" | "active") => {
    if (sortField === field) {
      // toggle direction
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  useEffect(() => {
    listTechnicians()
      .then((rows) => setItems(rows ?? []))
      .catch((e) => setError(e?.message ?? "Failed to load technicians"))
      .finally(() => setLoading(false));
  }, []);

  // Filter technicians based on search and filters
  const filteredTechnicians = items
    .filter((tech) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const fullName = [tech.first_name, tech.last_name].filter(Boolean).join(" ").toLowerCase();
      return (
        fullName.includes(term) ||
        (tech.email || "").toLowerCase().includes(term) ||
        (tech.phone || "").toLowerCase().includes(term)
      );
    })
    .filter((tech) => {
      if (!selectedSkill) return true;
      return Array.isArray(tech.skills) && tech.skills.includes(selectedSkill);
    })
    .filter((tech) => {
      if (!selectedStatus) return true;
      if (selectedStatus === "active") return tech.is_active !== false;
      if (selectedStatus === "inactive") return tech.is_active === false;
      return true;
    });

  const sortedTechnicians = [...filteredTechnicians].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: string | boolean | null | undefined;
    let bValue: string | boolean | null | undefined;
    
    // Handle special fields
    if (sortField === "name") {
      aValue = [a.first_name, a.last_name].filter(Boolean).join(" ");
      bValue = [b.first_name, b.last_name].filter(Boolean).join(" ");
    } else if (sortField === "skill") {
      aValue = Array.isArray(a.skills) && a.skills.length > 0 ? a.skills.join(", ") : "";
      bValue = Array.isArray(b.skills) && b.skills.length > 0 ? b.skills.join(", ") : "";
    } else if (sortField === "active") {
      aValue = a.is_active !== false;
      bValue = b.is_active !== false;
    } else {
      aValue = a[sortField as keyof Technician] as string | boolean | null | undefined;
      bValue = b[sortField as keyof Technician] as string | boolean | null | undefined;
    }
    
    // normalize booleans
    if (typeof aValue === "boolean") aValue = aValue ? "true" : "false";
    if (typeof bValue === "boolean") bValue = bValue ? "true" : "false";
    
    const aStr = (aValue ?? "").toString().toLowerCase();
    const bStr = (bValue ?? "").toString().toLowerCase();
    
    if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
    if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleExportCsv = () => {
    if (!sortedTechnicians || sortedTechnicians.length === 0) {
      return;
    }
    const headers = ["Name", "Email", "Phone", "Skill", "Active"];
    const rows = sortedTechnicians.map((tech) => [
      [tech.first_name, tech.last_name].filter(Boolean).join(" ") || "",
      tech.email ?? "",
      tech.phone ?? "",
      Array.isArray(tech.skills) && tech.skills.length > 0 ? tech.skills.join(", ") : "",
      tech.is_active !== false ? "Active" : "Inactive",
    ]);
    const escapeCell = (value: string) => {
      const v = value ?? "";
      // Escape double quotes and wrap in quotes
      return `"${v.replace(/"/g, '""')}"`;
    };
    const csvContent =
      [headers, ...rows]
        .map((row) => row.map((cell) => escapeCell(String(cell))).join(","))
        .join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "technicians.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalItems = sortedTechnicians.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTechnicians = sortedTechnicians.slice(startIndex, endIndex);

  const isFiltering =
    searchTerm !== "" || selectedSkill !== "" || selectedStatus !== "";
  const isSorted = sortField !== "";

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Technicians</h1>
        <Link
          href="/technicians/new"
          className="rounded-md border bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50"
        >
          + Add technician
        </Link>
      </div>
      {loading && (
        <div className="rounded-md border bg-gray-50 p-3 text-gray-700">
          Loading…
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}
      {!loading && !error && (
        <>
          {success === "created" && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800">
              Technician created successfully.
            </div>
          )}
          {success === "deleted" && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800">
              Technician deleted successfully.
            </div>
          )}

          <div className="mb-6 mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              className="w-full md:w-1/3 rounded-md border border-gray-300 px-3 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Skill Filter */}
            <select
              className="w-full md:w-1/4 rounded-md border border-gray-300 px-3 py-2"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
            >
              <option value="">All Skills</option>
              {Array.from(
                new Set(
                  items.flatMap((t) => 
                    Array.isArray(t.skills) ? t.skills : []
                  )
                )
              )
                .filter(Boolean)
                .sort()
                .map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
            </select>

            {/* Status Filter */}
            <select
              className="w-full md:w-1/4 rounded-md border border-gray-300 px-3 py-2"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {isFiltering && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSkill("");
                  setSelectedStatus("");
                }}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 md:ml-4 w-full md:w-auto"
              >
                Clear Filters
              </button>
            )}
            {isSorted && (
              <button
                onClick={() => {
                  setSortField("");
                  setSortDirection("asc");
                  setCurrentPage(1);
                }}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full md:w-auto"
              >
                Reset sort
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCsv}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full md:w-auto"
            >
              Export CSV
            </button>
          </div>

          {paginatedTechnicians.length === 0 ? (
            <div className="mt-6 text-center text-gray-600">
              No technicians found. Try adjusting your filters.
            </div>
          ) : (
            <div className="rounded-xl border">
              <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-3">ID</th>
                  <th
                    className="px-4 py-2 text-left text-sm font-medium text-gray-600 cursor-pointer select-none"
                    onClick={() => handleSort("name")}
                  >
                    Name
                    {sortField === "name" && (
                      <span className="ml-1 text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-sm font-medium text-gray-600 cursor-pointer select-none"
                    onClick={() => handleSort("email")}
                  >
                    Email
                    {sortField === "email" && (
                      <span className="ml-1 text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-sm font-medium text-gray-600 cursor-pointer select-none"
                    onClick={() => handleSort("phone")}
                  >
                    Phone
                    {sortField === "phone" && (
                      <span className="ml-1 text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th className="p-3">Skills</th>
                  <th
                    className="px-4 py-2 text-left text-sm font-medium text-gray-600 cursor-pointer select-none"
                    onClick={() => handleSort("active")}
                  >
                    Active
                    {sortField === "active" && (
                      <span className="ml-1 text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTechnicians.map((t) => (
                  <tr
                    key={String(t.id)}
                    onClick={() => router.push(`/technicians/${t.id}`)}
                    className="cursor-pointer hover:bg-gray-50 transition border-b last:border-0"
                  >
                    <td className="p-3">{String(t.id)}</td>
                    <td className="p-3">
                      {[t.first_name, t.last_name].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="p-3">{t.email ?? "—"}</td>
                    <td className="p-3">{t.phone ?? "—"}</td>
                    <td className="p-3">
                      {Array.isArray(t.skills) && t.skills.length > 0
                        ? t.skills.join(", ")
                        : "—"}
                    </td>
                    <td className="p-3">{t.is_active === false ? "No" : "Yes"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          <div className="mt-6 flex flex-col items-center gap-4 md:flex-row md:justify-between">
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">Rows per page:</span>
              <select
                className="rounded-md border border-gray-300 px-2 py-1"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>
            {/* Page navigation */}
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border px-3 py-1 disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`rounded-md border px-3 py-1 ${
                    page === currentPage ? "bg-gray-200 font-semibold" : ""
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="rounded-md border px-3 py-1 disabled:opacity-50"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}






