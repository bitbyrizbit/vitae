"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSession, useToast } from "@/lib/store";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { ToastContainer } from "@/components/Toast";
import { EmptyState } from "@/components/EmptyState";

/* ---------------------------------------------------------------- types */

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

/* ---------------------------------------------------------------- component */

export default function RegistryPage() {
  const router = useRouter();
  const { role, hydrate } = useSession();
  const { addToast } = useToast();

  const [rows, setRows] = useState<AdminAppraisal[]>([]);
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(true);

  // reject modal
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  /* ------------------------------------------------------------ auth */

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("vitae_role") : null;
    if (storedRole && !["admin", "hod", "iqac"].includes(storedRole)) {
      router.push("/dashboard"); return;
    }
    if (!storedRole) { router.push("/login"); return; }
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department]);

  /* ------------------------------------------------------------ data */

  async function loadRows() {
    setLoading(true);
    try {
      const res = await api.get("/admin/appraisals", {
        params: { sort_by: "submitted_at", order: "desc", department: department || undefined },
      });
      setRows(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  /* ------------------------------------------------------------ actions */

  async function handleDownload(id: number, employeeCode: string, year: string) {
    try {
      const res = await api.get(`/admin/appraisals/${id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${employeeCode}_${year}_appraisal.pdf`);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
    } catch { addToast("Failed to download PDF", "error"); }
  }

  async function handleApprove(id: number, decision: string) {
    try {
      await api.patch(`/admin/appraisals/${id}/review`, null, { params: { decision } });
      addToast("Appraisal approved", "success");
      loadRows();
    } catch { addToast("Failed to update appraisal", "error"); }
  }

  async function handleReject() {
    if (rejectTarget === null) return;
    try {
      await api.patch(`/admin/appraisals/${rejectTarget}/review`, null, {
        params: { decision: "rejected", note: rejectNote || undefined },
      });
      addToast("Appraisal rejected", "info");
      setRejectTarget(null);
      setRejectNote("");
      loadRows();
    } catch { addToast("Failed to reject appraisal", "error"); }
  }

  /* ------------------------------------------------------------ stats */

  const eligibleCount = rows.filter((r) => r.eligible_for_cas === "eligible").length;
  const pendingCount = rows.filter((r) => r.status === "submitted" || r.status === "hod_approved").length;

  /* ------------------------------------------------------------ render */

  return (
    <div className="min-h-screen flex flex-col bg-base overflow-hidden">
      <TopBar />
      <ToastContainer />

      <main className="flex-1 max-w-7xl mx-auto px-6 md:px-8 py-10 w-full flex flex-col h-[calc(100vh-4rem)]">
        
        {/* Header & Stats Row */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8 shrink-0">
          <div>
            <h1 className="text-3xl font-display text-blue mb-2">Faculty registry</h1>
            <p className="text-sm text-text-secondary">Review and approve faculty appraisals.</p>
          </div>
          
          <div className="flex gap-8 px-6 py-4 bg-surface-1 border border-rule rounded-[4px] shadow-sm">
            <div>
              <p className="text-[12px] text-text-tertiary font-medium mb-1">Total submitted</p>
              <p className="text-2xl font-mono text-blue leading-none">{rows.length}</p>
            </div>
            <div className="w-px bg-rule" />
            <div>
              <p className="text-[12px] text-text-tertiary font-medium mb-1">Eligible for CAS</p>
              <p className="text-2xl font-mono text-brown leading-none">{eligibleCount}</p>
            </div>
            <div className="w-px bg-rule" />
            <div>
              <p className="text-[12px] text-text-tertiary font-medium mb-1">Pending review</p>
              <p className="text-2xl font-mono text-text leading-none">{pendingCount}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 shrink-0 max-w-sm">
          <input
            placeholder="Filter by department..."
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Horizontal Appraisal Cards Feed */}
        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar pb-10">
          {loading ? (
            <div className="py-12 text-center text-sm text-text-tertiary animate-pulse-gentle">Loading registry...</div>
          ) : rows.length === 0 ? (
            <EmptyState message="No appraisals found matching your criteria." />
          ) : (
            <div className="flex flex-col gap-4">
              {rows.map((r, i) => (
                <div key={r.id} className={`p-6 bg-surface-1 border border-rule rounded-[4px] shadow-sm hover:border-rule-strong transition-colors animate-in stagger-${(i % 4) + 1} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
                  
                  {/* Identity */}
                  <div className="flex gap-5 min-w-0 flex-1">
                    <div className="hidden sm:flex w-12 h-12 bg-surface-2 rounded-full items-center justify-center border border-rule shrink-0">
                      <span className="text-lg font-display text-text-tertiary">{r.faculty_name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-medium text-text truncate">{r.faculty_name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[13px] font-mono text-text-secondary">{r.employee_code}</span>
                        <span className="text-[13px] text-text-tertiary truncate">{r.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scores & Status */}
                  <div className="flex items-center gap-6 shrink-0 md:w-[350px] justify-between border-t md:border-t-0 border-rule pt-4 md:pt-0">
                    <div>
                      <p className="text-[11px] text-text-tertiary font-medium mb-1">API Score</p>
                      <p className="text-xl font-mono text-brown">{r.total_api_score}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={r.eligible_for_cas} />
                      <StatusBadge status={r.status} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 shrink-0 md:w-[200px] border-t md:border-t-0 border-rule pt-4 md:pt-0">
                    <Button variant="secondary" size="sm" onClick={() => handleDownload(r.id, r.employee_code, r.academic_year)}>
                      View PDF
                    </Button>
                    
                    {role === "hod" && r.status === "submitted" && (
                      <Button size="sm" onClick={() => handleApprove(r.id, "hod_approved")} className="bg-sage hover:bg-sage">Approve</Button>
                    )}
                    {role === "iqac" && r.status === "hod_approved" && (
                      <Button size="sm" onClick={() => handleApprove(r.id, "iqac_approved")} className="bg-sage hover:bg-sage">Approve</Button>
                    )}
                    {["hod", "iqac", "admin"].includes(role || "") && r.status !== "rejected" && (
                      <Button variant="danger" size="sm" onClick={() => setRejectTarget(r.id)}>Reject</Button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Reject Modal */}
      <Modal open={rejectTarget !== null} onClose={() => { setRejectTarget(null); setRejectNote(""); }} title="Reject appraisal">
        <div className="space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">Reason for rejection (Optional)</label>
            <textarea
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Provide feedback for the faculty member..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-rule mt-2">
            <Button variant="ghost" onClick={() => { setRejectTarget(null); setRejectNote(""); }}>Cancel</Button>
            <Button variant="danger" onClick={handleReject}>Reject appraisal</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}