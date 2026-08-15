"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSession } from "@/lib/store";
import { TopBar } from "@/components/TopBar";
import { Section } from "@/components/Section";
import { Button } from "@/components/Button";

type AdminAppraisal = {
  id: number;
  faculty_id: number;
  faculty_name: string;
  employee_code: string;
  department: string;
  academic_year: string;
  total_api_score: number;
  eligible_for_cas: string;
  status: string;
  submitted_at: string | null;
};

const SORT_OPTIONS = [
  { value: "submitted_at", label: "submission date" },
  { value: "name", label: "faculty name" },
  { value: "employee_code", label: "employee code" },
  { value: "total_api_score", label: "API score" },
];

export default function RegistryPage() {
  const router = useRouter();
  const { role, hydrate } = useSession();

  const [rows, setRows] = useState<AdminAppraisal[]>([]);
  const [sortBy, setSortBy] = useState("submitted_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("vitae_role") : null;
    if (stored && !["admin", "hod", "iqac"].includes(stored)) {
      router.push("/dashboard");
      return;
    }
    if (!stored) {
      router.push("/login");
      return;
    }
    loadRows();
  }, [sortBy, order, department]);

  async function loadRows() {
    setLoading(true);
    try {
      const res = await api.get("/admin/appraisals", {
        params: { sort_by: sortBy, order, department: department || undefined },
      });
      setRows(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(id: number, employeeCode: string, year: string) {
    const res = await api.get(`/admin/appraisals/${id}/pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${employeeCode}_${year}_appraisal.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function handleReview(id: number, decision: string) {
    const note = decision === "rejected" ? prompt("reason for rejection (optional)") || undefined : undefined;
    await api.patch(`/admin/appraisals/${id}/review`, null, { params: { decision, note } });
    loadRows();
  }

  const eligibleCount = rows.filter((r) => r.eligible_for_cas === "eligible").length;

  return (
    <main className="min-h-screen bg-paper">
      <TopBar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <Section title="Faculty Registry" subtitle={`${rows.length} appraisals on record, ${eligibleCount} eligible for CAS review`}>
          <div className="flex flex-wrap gap-3 mb-6">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>sort by {opt.label}</option>
              ))}
            </select>
            <select value={order} onChange={(e) => setOrder(e.target.value as "asc" | "desc")}>
              <option value="desc">descending</option>
              <option value="asc">ascending</option>
            </select>
            <input
              placeholder="filter by department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
          </div>

          {loading ? (
            <p className="text-ink-soft text-sm">loading registry...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>employee code</th>
                  <th>faculty</th>
                  <th>department</th>
                  <th>year</th>
                  <th>API score</th>
                  <th>CAS status</th>
                  <th>review status</th>
                  <th>actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.employee_code}</td>
                    <td>{r.faculty_name}</td>
                    <td>{r.department}</td>
                    <td className="font-mono">{r.academic_year}</td>
                    <td className="font-mono">{r.total_api_score}</td>
                    <td>
                      <span className={`px-2 py-1 text-xs font-mono uppercase ${r.eligible_for_cas === "eligible" ? "bg-forest text-paper" : "bg-border text-ink-soft"}`}>
                        {r.eligible_for_cas === "eligible" ? "eligible" : "not eligible"}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs uppercase text-ink-soft">{r.status}</span>
                    </td>
                    <td>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => handleDownload(r.id, r.employee_code, r.academic_year)} className="text-xs text-maroon hover:underline">
                          PDF
                        </button>
                        {role === "hod" && r.status === "submitted" && (
                          <button onClick={() => handleReview(r.id, "hod_approved")} className="text-xs text-forest hover:underline">
                            approve
                          </button>
                        )}
                        {role === "iqac" && r.status === "hod_approved" && (
                          <button onClick={() => handleReview(r.id, "iqac_approved")} className="text-xs text-forest hover:underline">
                            approve
                          </button>
                        )}
                        {(role === "hod" || role === "iqac" || role === "admin") && r.status !== "rejected" && (
                          <button onClick={() => handleReview(r.id, "rejected")} className="text-xs text-brick hover:underline">
                            reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="text-ink-soft text-center">no appraisals submitted yet</td></tr>
                )}
              </tbody>
            </table>
          )}
        </Section>
      </div>
    </main>
  );
}