"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSession, useToast } from "@/lib/store";
import { TopBar } from "@/components/TopBar";
import { Section } from "@/components/Section";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable, Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { ToastContainer } from "@/components/Toast";

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

/* ---------------------------------------------------------------- constants */

const SORT_OPTIONS = [
  { value: "submitted_at", label: "submission date" },
  { value: "name", label: "faculty name" },
  { value: "employee_code", label: "employee code" },
  { value: "total_api_score", label: "api score" },
];

/* ---------------------------------------------------------------- component */

export default function RegistryPage() {
  const router = useRouter();
  const { role, hydrate } = useSession();
  const { addToast } = useToast();

  const [rows, setRows] = useState<AdminAppraisal[]>([]);
  const [sortBy, setSortBy] = useState("submitted_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(true);

  // reject modal
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  /* ------------------------------------------------------------ auth guard */

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const storedRole =
      typeof window !== "undefined"
        ? localStorage.getItem("vitae_role")
        : null;
    if (storedRole && !["admin", "hod", "iqac"].includes(storedRole)) {
      router.push("/dashboard");
      return;
    }
    if (!storedRole) {
      router.push("/login");
      return;
    }
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, order, department]);

  /* ------------------------------------------------------------ data */

  async function loadRows() {
    setLoading(true);
    try {
      const res = await api.get("/admin/appraisals", {
        params: {
          sort_by: sortBy,
          order,
          department: department || undefined,
        },
      });
      setRows(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  /* ------------------------------------------------------------ actions */

  async function handleDownload(
    id: number,
    employeeCode: string,
    year: string
  ) {
    try {
      const res = await api.get(`/admin/appraisals/${id}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${employeeCode}_${year}_appraisal.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      addToast("failed to download pdf", "error");
    }
  }

  async function handleApprove(id: number, decision: string) {
    try {
      await api.patch(`/admin/appraisals/${id}/review`, null, {
        params: { decision },
      });
      addToast("appraisal approved", "success");
      loadRows();
    } catch {
      addToast("failed to update appraisal", "error");
    }
  }

  async function handleReject() {
    if (rejectTarget === null) return;
    try {
      await api.patch(`/admin/appraisals/${rejectTarget}/review`, null, {
        params: { decision: "rejected", note: rejectNote || undefined },
      });
      addToast("appraisal rejected", "info");
      setRejectTarget(null);
      setRejectNote("");
      loadRows();
    } catch {
      addToast("failed to reject appraisal", "error");
    }
  }

  /* ------------------------------------------------------------ stats */

  const eligibleCount = rows.filter(
    (r) => r.eligible_for_cas === "eligible"
  ).length;
  const pendingCount = rows.filter(
    (r) => r.status === "submitted" || r.status === "hod_approved"
  ).length;

  /* ------------------------------------------------------------ columns */

  const columns: Column<AdminAppraisal>[] = [
    {
      key: "employee_code",
      label: "code",
      mono: true,
      shrink: true,
    },
    { key: "faculty_name", label: "faculty" },
    {
      key: "department",
      label: "department",
      render: (r) => (
        <span className="text-text-tertiary text-[13px]">{r.department}</span>
      ),
    },
    { key: "academic_year", label: "year", mono: true, shrink: true },
    {
      key: "total_api_score",
      label: "score",
      mono: true,
      shrink: true,
      render: (r) => (
        <span className="text-text font-mono">{r.total_api_score}</span>
      ),
    },
    {
      key: "eligible_for_cas",
      label: "cas",
      shrink: true,
      render: (r) => <StatusBadge status={r.eligible_for_cas} />,
    },
    {
      key: "status",
      label: "review",
      shrink: true,
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      label: "",
      shrink: true,
      render: (r) => (
        <div className="flex gap-3 items-center">
          <button
            onClick={() =>
              handleDownload(r.id, r.employee_code, r.academic_year)
            }
            className="text-[11px] text-text-tertiary hover:text-gold transition-colors cursor-pointer"
          >
            pdf
          </button>

          {role === "hod" && r.status === "submitted" && (
            <button
              onClick={() => handleApprove(r.id, "hod_approved")}
              className="text-[11px] text-sage hover:text-sage transition-colors cursor-pointer"
            >
              approve
            </button>
          )}

          {role === "iqac" && r.status === "hod_approved" && (
            <button
              onClick={() => handleApprove(r.id, "iqac_approved")}
              className="text-[11px] text-sage hover:text-sage transition-colors cursor-pointer"
            >
              approve
            </button>
          )}

          {["hod", "iqac", "admin"].includes(role || "") &&
            r.status !== "rejected" && (
              <button
                onClick={() => setRejectTarget(r.id)}
                className="text-[11px] text-text-ghost hover:text-coral transition-colors cursor-pointer"
              >
                reject
              </button>
            )}
        </div>
      ),
    },
  ];

  /* ------------------------------------------------------------ render */

  return (
    <main className="min-h-screen bg-base">
      <TopBar />
      <ToastContainer />

      <div className="max-w-6xl mx-auto px-6 md:px-8 py-10">
        <Section
          title="Faculty registry"
          subtitle={`${rows.length} appraisal${rows.length !== 1 ? "s" : ""} on record`}
        >
          {/* stats strip */}
          <div className="flex flex-wrap gap-6 mb-6 pb-6 border-b border-rule-subtle">
            <div>
              <p className="text-[11px] text-text-tertiary font-mono mb-0.5">
                total
              </p>
              <p className="text-xl font-mono text-text">{rows.length}</p>
            </div>
            <div>
              <p className="text-[11px] text-text-tertiary font-mono mb-0.5">
                eligible
              </p>
              <p className="text-xl font-mono text-gold">{eligibleCount}</p>
            </div>
            <div>
              <p className="text-[11px] text-text-tertiary font-mono mb-0.5">
                pending review
              </p>
              <p className="text-xl font-mono text-sky">{pendingCount}</p>
            </div>
          </div>

          {/* filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-auto flex-none"
              style={{ width: "auto" }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  sort by {opt.label}
                </option>
              ))}
            </select>
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
              className="w-auto flex-none"
              style={{ width: "auto" }}
            >
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

          {/* table */}
          {loading ? (
            <div className="py-12 text-center">
              <p className="text-sm text-text-tertiary animate-pulse-gentle">
                loading registry...
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={rows}
              keyExtractor={(r) => r.id}
              emptyMessage="no appraisals submitted yet"
            />
          )}
        </Section>
      </div>

      {/* reject modal */}
      <Modal
        open={rejectTarget !== null}
        onClose={() => {
          setRejectTarget(null);
          setRejectNote("");
        }}
        title="Reject appraisal"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] text-text-secondary mb-1.5">
              reason for rejection (optional)
            </label>
            <textarea
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="provide feedback for the faculty member..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setRejectTarget(null);
                setRejectNote("");
              }}
            >
              cancel
            </Button>
            <Button variant="danger" onClick={handleReject}>
              reject appraisal
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}