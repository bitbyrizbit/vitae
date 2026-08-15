"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSession } from "@/lib/store";
import { Button } from "@/components/Button";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useSession((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post(`/auth/login`, null, {
        params: { email, password },
      });
      const { access_token, role, name } = res.data;
      setSession(access_token, role, name);

      if (["admin", "hod", "iqac"].includes(role)) {
        router.push("/registry");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "login failed, check your credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl text-ink mb-1">Vitae</h1>
        <p className="font-mono text-xs text-ink-soft mb-8">faculty registry sign in</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-ink-soft mb-1">email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-ink-soft mb-1">password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
            />
          </div>

          {error && <p className="text-brick text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "signing in..." : "sign in"}
          </Button>
        </form>

        <p className="text-sm text-ink-soft mt-6">
          new faculty member?{" "}
          <a href="/register" className="text-maroon hover:underline">
            register here
          </a>
        </p>
      </div>
    </main>
  );
}