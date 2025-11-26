"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTechnician, updateTechnician, type UpdateTechnicianInput, type Technician } from "@/lib/api/technicians";

export default function EditTechnicianPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [tech, setTech] = useState<Technician | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [isActive, setIsActive]   = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    skillsText?: string;
  }>({});
  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing technician
  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    getTechnician(id)
      .then((t) => {
        setTech(t);
        if (!t) return;

        setFirstName(t.first_name ?? "");
        setLastName(t.last_name ?? "");
        setEmail(t.email ?? "");
        setPhone(t.phone ?? "");

        // skills may be an array or a comma-separated string
        const skillsArr = Array.isArray(t.skills)
          ? t.skills
          : typeof (t as any).skills === "string"
          ? (t as any).skills.split(",").map((s: string) => s.trim())
          : [];
        setSkillsText(skillsArr.filter(Boolean).join(", "));

        setIsActive(t.is_active !== false);
      })
      .catch((e) => {
        console.error("Failed to load technician", e);
        setError(e?.message ?? "Failed to load technician");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;

    setFormMessage(null);
    const newErrors: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      skillsText?: string;
    } = {};

    // Basic required validation
    if (!firstName || !firstName.trim()) {
      newErrors.firstName = "First name is required.";
    }
    if (!lastName || !lastName.trim()) {
      newErrors.lastName = "Last name is required.";
    }
    if (!email || !email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address.";
    }
    if (phone && phone.replace(/\D/g, "").length > 0) {
      if (phone.replace(/\D/g, "").length < 8) {
        newErrors.phone = "Phone number looks too short.";
      }
    }
    if (!skillsText || !skillsText.trim()) {
      newErrors.skillsText = "Please add at least one skill.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormMessage({
        type: "error",
        text: "Please fix the highlighted fields.",
      });
      return;
    }

    // no validation errors
    setErrors({});
    setIsSubmitting(true);

    try {
      const skills =
        skillsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

      const payload: UpdateTechnicianInput = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        skills: skills.length ? skills : undefined,
        is_active: isActive,
      };

      const updated = await updateTechnician(id, payload);

      if (updated && updated.id != null) {
        router.push(`/technicians/${updated.id}?success=updated`);
      } else {
        router.push("/technicians");
      }
    } catch (error) {
      console.error(error);
      setFormMessage({
        type: "error",
        text: "Something went wrong while saving. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="p-6">
      {loading && (
        <div className="max-w-3xl mx-auto mt-8 rounded-md border bg-gray-50 p-3 text-gray-700 text-sm">
          Loading…
        </div>
      )}

      {error && !loading && (
        <div className="max-w-3xl mx-auto mt-8 rounded-md border border-red-300 bg-red-50 p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !tech && !error && (
        <div className="max-w-3xl mx-auto mt-8 rounded-md border bg-gray-50 p-3 text-gray-700 text-sm">
          Technician not found.
        </div>
      )}

      {!loading && tech && (
        <div className="max-w-3xl mx-auto mt-8 rounded-lg border p-6 shadow-sm space-y-6">
          <h1 className="text-2xl font-semibold">Edit technician</h1>

          {formMessage && (
            <div
              className={`rounded-md border px-3 py-2 text-sm ${
                formMessage.type === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {formMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`w-full rounded-md border px-3 py-2 ${
                    errors.firstName ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`w-full rounded-md border px-3 py-2 ${
                    errors.lastName ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full rounded-md border px-3 py-2 ${
                    errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                  }`}
                  placeholder="1234567890"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  className={`w-full rounded-md border px-3 py-2 ${
                    errors.skillsText ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                  }`}
                  placeholder="HVAC, electrician, plumber"
                />
                {errors.skillsText && (
                  <p className="mt-1 text-xs text-red-600">{errors.skillsText}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Active</label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300"
              />
            </div>
            <div className="pt-4 flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md border px-4 py-2 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
              <a
                href="/technicians"
                className="rounded-md border px-4 py-2 hover:bg-gray-100"
              >
                Cancel
              </a>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

