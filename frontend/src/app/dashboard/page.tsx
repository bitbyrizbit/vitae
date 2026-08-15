"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSession, useToast } from "@/lib/store";
import { TopBar } from "@/components/TopBar";
import { Section } from "@/components/Section";
import { Button } from "@/components/Button";
import { ScoreCard } from "@/components/ScoreCard";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable, Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { ToastContainer } from "@/components/Toast";

/* ---------------------------------------------------------------- types */

type Publication = {
  id: number;
  title: string;
  journal_or_conference: string | null;
  year: number | null;
  citation_count: number;
  pub_type: string;
  is_scopus_or_wos: boolean;
  source: string;
  api_score: number;
};

type Activity = {
  id: number;
  activity_type: string;
  title: string;
  description: string | null;
  role: string | null;
  activity_date: string | null;
  api_score: number;
};

type Appraisal = {
  academic_year: string;
  category_i_score: number;
  category_ii_score: number;
  category_iii_score: number;
  total_api_score: number;
  eligible_for_cas: string;
  status: string;
};

/* ---------------------------------------------------------------- constants */

const ACADEMIC_YEAR = "2025-26";

const PUB_TYPES = [
  { value: "journal", label: "journal" },
  { value: "conference", label: "conference" },
  { value: "book_chapter", label: "book chapter" },
  { value: "book_authored", label: "book authored" },
  { value: "book_edited", label: "book edited" },
  { value: "patent_national", label: "patent (national)" },
  { value: "patent_international", label: "patent (international)" },
];

const ACTIVITY_TYPES = [
  { value: "seminar_attended", label: "seminar attended" },
  { value: "seminar_organized", label: "seminar organized" },
  { value: "workshop_attended", label: "workshop attended" },
  { value: "workshop_organized", label: "workshop organized" },
  { value: "fdp_attended", label: "fdp attended" },
  { value: "fdp_organized", label: "fdp organized" },
  { value: "guest_lecture", label: "guest lecture" },
  { value: "invited_talk", label: "invited talk" },
  { value: "project_pi_major", label: "project pi (major)" },
  { value: "project_pi_minor", label: "project pi (minor)" },
  { value: "project_coinvestigator", label: "project co-investigator" },
  { value: "committee_member", label: "committee member" },
  { value: "committee_chair", label: "committee chair" },
];

/* ---------------------------------------------------------------- component */

export default function DashboardPage() {
  const router = useRouter();
  const { token, hydrate } = useSession();
  const { addToast } = useToast();

  const [publications, setPublications] = useState<Publication[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [appraisal, setAppraisal] = useState<Appraisal | null>(null);
  const [scholarId, setScholarId] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // modal states
  const [pubModalOpen, setPubModalOpen] = useState(false);
  const [actModalOpen, setActModalOpen] = useState(false);

  // forms
  const [pubForm, setPubForm] = useState({
    title: "",
    journal_or_conference: "",
    year: "",
    citation_count: "0",
    pub_type: "journal",
    is_scopus_or_wos: false,
    is_ugc_care: false,
  });

  const [actForm, setActForm] = useState({
    activity_type: "seminar_attended",
    title: "",
    activity_date: "",
    role: "",
    description: "",
  });

  /* ------------------------------------------------------------ auth guard */

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!token) {
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem("vitae_token")
          : null;
      if (!stored) {
        router.push("/login");
        return;
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ------------------------------------------------------------ data loading */

  async function loadData() {
    try {
      const [pubRes, actRes] = await Promise.all([
        api.get("/faculty/me/publications"),
        api.get("/faculty/me/activities"),
      ]);
      setPublications(pubRes.data);
      setActivities(actRes.data);
    } catch (err) {
      console.error(err);
    }

    try {
      const res = await api.get(`/faculty/me/appraisal/${ACADEMIC_YEAR}`);
      setAppraisal(res.data);
    } catch {
      setAppraisal(null);
    }
  }

  /* ------------------------------------------------------------ publications */

  async function handleAddPublication(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/faculty/me/publications", {
        ...pubForm,
        year: pubForm.year ? parseInt(pubForm.year) : null,
        citation_count: parseInt(pubForm.citation_count) || 0,
      });
      setPubForm({
        title: "",
        journal_or_conference: "",
        year: "",
        citation_count: "0",
        pub_type: "journal",
        is_scopus_or_wos: false,
        is_ugc_care: false,
      });
      setPubModalOpen(false);
      addToast("publication added", "success");
      loadData();
    } catch {
      addToast("failed to add publication", "error");
    }
  }

  async function handleDeletePub(id: number) {
    try {
      await api.delete(`/faculty/me/publications/${id}`);
      addToast("publication removed", "info");
      loadData();
    } catch {
      addToast("failed to remove publication", "error");
    }
  }

  /* ------------------------------------------------------------ activities */

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/faculty/me/activities", {
        ...actForm,
        activity_date: actForm.activity_date || null,
        description: actForm.description || null,
      });
      setActForm({
        activity_type: "seminar_attended",
        title: "",
        activity_date: "",
        role: "",
        description: "",
      });
      setActModalOpen(false);
      addToast("activity logged", "success");
      loadData();
    } catch {
      addToast("failed to log activity", "error");
    }
  }

  async function handleDeleteAct(id: number) {
    try {
      await api.delete(`/faculty/me/activities/${id}`);
      addToast("activity removed", "info");
      loadData();
    } catch {
      addToast("failed to remove activity", "error");
    }
  }

  /* ------------------------------------------------------------ scholar */

  async function handleScholarLink() {
    if (!scholarId.trim()) return;
    try {
      await api.post("/faculty/me/scholar-link", {
        scholar_profile_id: scholarId.trim(),
      });
      addToast("scholar profile linked", "success");
    } catch {
      addToast("failed to link profile", "error");
    }
  }

  async function handleScholarSync() {
    setSyncing(true);
    try {
      const res = await api.post("/faculty/me/scholar-sync");
      const count = res.data?.length || 0;
      addToast(
        count > 0
          ? `${count} new publication${count > 1 ? "s" : ""} synced`
          : "no new publications found",
        count > 0 ? "success" : "info"
      );
      loadData();
    } catch {
      addToast("sync failed -- check your profile id", "error");
    } finally {
      setSyncing(false);
    }
  }

  /* ------------------------------------------------------------ appraisal */

  async function handleSubmitAppraisal() {
    setSubmitting(true);
    try {
      const res = await api.post(`/faculty/me/appraisal/${ACADEMIC_YEAR}`);
      setAppraisal(res.data);
      addToast("appraisal submitted", "success");
    } catch {
      addToast("failed to submit appraisal", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownloadPdf() {
    try {
      const res = await api.get(
        `/faculty/me/appraisal/${ACADEMIC_YEAR}/pdf`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `appraisal_${ACADEMIC_YEAR}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      addToast("failed to download pdf", "error");
    }
  }

  /* ------------------------------------------------------------ table columns */

  const pubColumns: Column<Publication>[] = [
    { key: "title", label: "title" },
    {
      key: "journal_or_conference",
      label: "venue",
      render: (r) => (
        <span className="text-text-tertiary">
          {r.journal_or_conference || "-"}
        </span>
      ),
    },
    { key: "year", label: "year", mono: true, shrink: true },
    {
      key: "pub_type",
      label: "type",
      shrink: true,
      render: (r) => (
        <span className="text-[12px] text-text-tertiary">
          {r.pub_type.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "source",
      label: "source",
      shrink: true,
      render: (r) => (
        <span className="font-mono text-[11px] text-text-tertiary">
          {r.source}
        </span>
      ),
    },
    { key: "api_score", label: "score", mono: true, shrink: true },
    {
      key: "actions",
      label: "",
      shrink: true,
      render: (r) => (
        <button
          onClick={() => handleDeletePub(r.id)}
          className="text-[11px] text-text-ghost hover:text-coral transition-colors cursor-pointer"
        >
          remove
        </button>
      ),
    },
  ];

  const actColumns: Column<Activity>[] = [
    { key: "title", label: "title" },
    {
      key: "activity_type",
      label: "type",
      shrink: true,
      render: (r) => (
        <span className="text-[12px] text-text-tertiary">
          {r.activity_type.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "activity_date",
      label: "date",
      mono: true,
      shrink: true,
      render: (r) => <>{r.activity_date || "-"}</>,
    },
    { key: "api_score", label: "score", mono: true, shrink: true },
    {
      key: "actions",
      label: "",
      shrink: true,
      render: (r) => (
        <button
          onClick={() => handleDeleteAct(r.id)}
          className="text-[11px] text-text-ghost hover:text-coral transition-colors cursor-pointer"
        >
          remove
        </button>
      ),
    },
  ];

  /* ------------------------------------------------------------ render */

  return (
    <main className="min-h-screen bg-base">
      <TopBar />
      <ToastContainer />

      <div className="max-w-5xl mx-auto px-6 md:px-8 py-10">
        {/* ---- score overview ---- */}
        <Section
          title="Academic performance summary"
          subtitle={`Academic year ${ACADEMIC_YEAR}`}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <ScoreCard
              label="category i"
              value={appraisal?.category_i_score ?? 0}
            />
            <ScoreCard
              label="category ii"
              value={appraisal?.category_ii_score ?? 0}
            />
            <ScoreCard
              label="category iii"
              value={appraisal?.category_iii_score ?? 0}
            />
            <ScoreCard
              label="total api score"
              value={appraisal?.total_api_score ?? 0}
              emphasis
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {appraisal && (
              <>
                <StatusBadge status={appraisal.eligible_for_cas} />
                <StatusBadge status={appraisal.status} />
              </>
            )}
            {!appraisal && (
              <p className="text-sm text-text-tertiary">
                no appraisal submitted yet for this academic year
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-5">
            <Button
              onClick={handleSubmitAppraisal}
              loading={submitting}
              disabled={submitting}
            >
              {appraisal ? "recalculate and resubmit" : "submit appraisal"}
            </Button>
            {appraisal && (
              <Button variant="secondary" onClick={handleDownloadPdf}>
                download pdf
              </Button>
            )}
          </div>
        </Section>

        {/* ---- google scholar ---- */}
        <Section
          title="Google Scholar sync"
          subtitle="publications auto-fetched from your scholar profile"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              placeholder="scholar profile id (from the url after ?user=)"
              value={scholarId}
              onChange={(e) => setScholarId(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2 shrink-0">
              <Button variant="secondary" size="sm" onClick={handleScholarLink}>
                link profile
              </Button>
              <Button
                size="sm"
                onClick={handleScholarSync}
                disabled={syncing}
                loading={syncing}
              >
                {syncing ? "syncing..." : "sync now"}
              </Button>
            </div>
          </div>
        </Section>

        {/* ---- publications ---- */}
        <Section
          title="Research publications"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPubModalOpen(true)}
            >
              add publication
            </Button>
          }
        >
          <DataTable
            columns={pubColumns}
            data={publications}
            keyExtractor={(r) => r.id}
            emptyMessage="no publications logged yet"
          />
        </Section>

        {/* ---- activities ---- */}
        <Section
          title="Events, seminars, projects and lectures"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActModalOpen(true)}
            >
              log activity
            </Button>
          }
        >
          <DataTable
            columns={actColumns}
            data={activities}
            keyExtractor={(r) => r.id}
            emptyMessage="no activities logged yet"
          />
        </Section>
      </div>

      {/* ---- publication modal ---- */}
      <Modal
        open={pubModalOpen}
        onClose={() => setPubModalOpen(false)}
        title="Add a publication"
      >
        <form onSubmit={handleAddPublication} className="space-y-4">
          <div>
            <label className="block text-[12px] text-text-secondary mb-1.5">
              title
            </label>
            <input
              required
              value={pubForm.title}
              onChange={(e) =>
                setPubForm({ ...pubForm, title: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-text-secondary mb-1.5">
                journal / conference
              </label>
              <input
                value={pubForm.journal_or_conference}
                onChange={(e) =>
                  setPubForm({
                    ...pubForm,
                    journal_or_conference: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-[12px] text-text-secondary mb-1.5">
                year
              </label>
              <input
                type="number"
                value={pubForm.year}
                onChange={(e) =>
                  setPubForm({ ...pubForm, year: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-text-secondary mb-1.5">
                publication type
              </label>
              <select
                value={pubForm.pub_type}
                onChange={(e) =>
                  setPubForm({ ...pubForm, pub_type: e.target.value })
                }
              >
                {PUB_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] text-text-secondary mb-1.5">
                citation count
              </label>
              <input
                type="number"
                value={pubForm.citation_count}
                onChange={(e) =>
                  setPubForm({ ...pubForm, citation_count: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={pubForm.is_scopus_or_wos}
                onChange={(e) =>
                  setPubForm({
                    ...pubForm,
                    is_scopus_or_wos: e.target.checked,
                  })
                }
              />
              scopus / web of science indexed
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={pubForm.is_ugc_care}
                onChange={(e) =>
                  setPubForm({ ...pubForm, is_ugc_care: e.target.checked })
                }
              />
              ugc care listed
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setPubModalOpen(false)}
            >
              cancel
            </Button>
            <Button type="submit">add publication</Button>
          </div>
        </form>
      </Modal>

      {/* ---- activity modal ---- */}
      <Modal
        open={actModalOpen}
        onClose={() => setActModalOpen(false)}
        title="Log an activity"
      >
        <form onSubmit={handleAddActivity} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-text-secondary mb-1.5">
                activity type
              </label>
              <select
                value={actForm.activity_type}
                onChange={(e) =>
                  setActForm({ ...actForm, activity_type: e.target.value })
                }
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] text-text-secondary mb-1.5">
                date
              </label>
              <input
                type="date"
                value={actForm.activity_date}
                onChange={(e) =>
                  setActForm({ ...actForm, activity_date: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] text-text-secondary mb-1.5">
              title
            </label>
            <input
              required
              value={actForm.title}
              onChange={(e) =>
                setActForm({ ...actForm, title: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-[12px] text-text-secondary mb-1.5">
              your role (organizer, speaker, pi, etc)
            </label>
            <input
              value={actForm.role}
              onChange={(e) =>
                setActForm({ ...actForm, role: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-[12px] text-text-secondary mb-1.5">
              description (optional)
            </label>
            <textarea
              rows={2}
              value={actForm.description}
              onChange={(e) =>
                setActForm({ ...actForm, description: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setActModalOpen(false)}
            >
              cancel
            </Button>
            <Button type="submit">log activity</Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}