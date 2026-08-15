"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSession } from "@/lib/store";
import { Button } from "@/components/Button";

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
      const res = await api.post(`/auth/register`, form);
      const { access_token, role, name } = res.data;
      setSession(access_token, role, name);

      if (["admin", "hod", "iqac"].includes(role)) {
        router.push("/registry");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-3xl text-ink mb-1">Vitae</h1>
        <p className="font-mono text-xs text-ink-soft mb-8">register a faculty record</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-ink-soft mb-1">full name</label>
            <input required value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-mono text-ink-soft mb-1">email</label>
            <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-mono text-ink-soft mb-1">employee code</label>
            <input required value={form.employee_code} onChange={(e) => update("employee_code", e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-mono text-ink-soft mb-1">password</label>
            <input type="password" required value={form.password} onChange={(e) => update("password", e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-mono text-ink-soft mb-1">department</label>
            <input required value={form.department} onChange={(e) => update("department", e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-mono text-ink-soft mb-1">designation</label>
            <select value={form.designation} onChange={(e) => update("designation", e.target.value)} className="w-full">
              <option>Assistant Professor</option>
              <option>Associate Professor</option>
              <option>Professor</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-ink-soft mb-1">role</label>
            <select value={form.role} onChange={(e) => update("role", e.target.value)} className="w-full">
              <option value="faculty">faculty</option>
              <option value="hod">head of department</option>
              <option value="iqac">iqac coordinator</option>
              <option value="admin">admin</option>
            </select>
          </div>

          {error && <p className="text-brick text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "creating record..." : "register"}
          </Button>
        </form>

        <p className="text-sm text-ink-soft mt-6">
          already registered?{" "}
          <a href="/login" className="text-maroon hover:underline">
            sign in
          </a>
        </p>
      </div>
    </main>
  );
}