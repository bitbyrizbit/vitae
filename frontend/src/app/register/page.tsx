"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useSession } from "@/lib/store";
import { Button } from "@/components/Button";

const DESIGNATIONS = ["Assistant Professor", "Associate Professor", "Professor"];

const ROLES = [
  { value: "faculty", label: "faculty" },
  { value: "hod", label: "head of department" },
  { value: "iqac", label: "iqac coordinator" },
  { value: "admin", label: "admin" },
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
          ?.detail || "registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-base flex flex-col">
      <div className="h-[2px] bg-gold" />

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md animate-in">
          <Link href="/" className="inline-block mb-8">
            <h1 className="text-3xl text-text font-display hover:text-gold transition-colors duration-200">
              Vitae
            </h1>
          </Link>
          <p className="font-mono text-[11px] text-text-tertiary mb-8">
            register a faculty record
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* two-column row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] text-text-secondary mb-1.5">
                  full name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="block text-[12px] text-text-secondary mb-1.5">
                  email
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] text-text-secondary mb-1.5">
                  employee code
                </label>
                <input
                  required
                  value={form.employee_code}
                  onChange={(e) => update("employee_code", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[12px] text-text-secondary mb-1.5">
                  department
                </label>
                <input
                  required
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] text-text-secondary mb-1.5">
                  designation
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
                <label className="block text-[12px] text-text-secondary mb-1.5">
                  role
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
              <label className="block text-[12px] text-text-secondary mb-1.5">
                password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {error && <p className="text-coral text-sm">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="w-full"
            >
              {loading ? "creating record..." : "register"}
            </Button>
          </form>

          <p className="text-sm text-text-secondary mt-8">
            already registered?{" "}
            <Link
              href="/login"
              className="text-gold hover:text-gold-bright transition-colors duration-200"
            >
              sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}