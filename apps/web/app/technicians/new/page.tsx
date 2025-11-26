"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createTechnician, type CreateTechnicianInput } from "@/lib/api/technicians";

export default function NewTechnicianPage() {
  const router = useRouter();

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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

      const payload: CreateTechnicianInput = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        skills: skills.length ? skills : undefined,
        is_active: isActive,
      };

      const created = await createTechnician(payload);

      // After successful creation, go to the detail page if id exists,
      // otherwise back to the list as a fallback.
      if (created && created.id != null) {
        router.push(`/technicians?success=created`);
      } else {
        router.push("/technicians?success=created");
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
      <div className="max-w-3xl mx-auto mt-8 rounded-lg border p-6 shadow-sm space-y-6">
        <h1 className="text-2xl font-semibold">Add technician</h1>

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
    </main>
  );
}
