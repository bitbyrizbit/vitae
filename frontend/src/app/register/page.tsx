"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useSession } from "@/lib/store";
import { Button } from "@/components/Button";

const DESIGNATIONS = ["Assistant Professor", "Associate Professor", "Professor"];
const ROLES = [
  { value: "faculty", label: "Faculty" },
  { value: "hod", label: "Head of department" },
  { value: "iqac", label: "IQAC coordinator" },
  { value: "admin", label: "Administrator" },
];

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useSession((s) => s.setSession);

  const [form, setForm] = useState({
    name: "",
    email: "",
    employee_code: "",
    password: "",
    department: "",
    designation: "Assistant Professor",
    role: "faculty",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/register", form);
      const { access_token, role, name } = res.data;
      setSession(access_token, role, name);

      if (["admin", "hod", "iqac"].includes(role)) {
        router.push("/registry");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Registration failed. Please check your details.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface-2 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-[500px] bg-surface-1 p-8 md:p-10 rounded-[4px] shadow-sm border border-rule animate-in">
        
        <Link href="/" className="inline-block mb-8">
          <h1 className="text-3xl text-blue font-display tracking-tight hover:text-brown transition-colors">
            Vitae
          </h1>
        </Link>
        
        <h2 className="text-xl text-text font-medium mb-1">Create a dossier</h2>
        <p className="text-sm text-text-tertiary mb-8">
          Register your faculty record below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-2">
                Full name
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-2">
                Email address
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-2">
                Employee code
              </label>
              <input
                required
                value={form.employee_code}
                onChange={(e) => update("employee_code", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-2">
                Department
              </label>
              <input
                required
                value={form.department}
                onChange={(e) => update("department", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-2">
                Designation
              </label>
              <select
                value={form.designation}
                onChange={(e) => update("designation", e.target.value)}
              >
                {DESIGNATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-2">
                System role
              </label>
              <select
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-coral text-[13px] font-medium">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            className="w-full mt-2"
          >
            {loading ? "Creating record..." : "Register faculty record"}
          </Button>
        </form>

        <div className="mt-10 pt-6 border-t border-rule text-center">
          <p className="text-sm text-text-secondary">
            Already registered?{" "}
            <Link
              href="/login"
              className="font-medium text-brown hover:text-brown-dim transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}