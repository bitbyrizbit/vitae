"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSession } from "@/lib/store";
import { TopBar } from "@/components/TopBar";
import { Section } from "@/components/Section";
import { Button } from "@/components/Button";

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

const ACADEMIC_YEAR = "2025-26";

const ACTIVITY_TYPES = [
  "seminar_attended", "seminar_organized", "workshop_attended", "workshop_organized",
  "fdp_attended", "fdp_organized", "guest_lecture", "invited_talk",
  "project_pi_major", "project_pi_minor", "project_coinvestigator",
  "committee_member", "committee_chair",
];

export default function DashboardPage() {
  const router = useRouter();
  const { token, hydrate } = useSession();

  const [publications, setPublications] = useState<Publication[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [appraisal, setAppraisal] = useState<Appraisal | null>(null);
  const [scholarId, setScholarId] = useState("");
  const [syncing, setSyncing] = useState(false);

  const [pubForm, setPubForm] = useState({
    title: "", journal_or_conference: "", year: "", citation_count: "0",
    pub_type: "journal", is_scopus_or_wos: false, is_ugc_care: false,
  });

  const [actForm, setActForm] = useState({
    activity_type: "seminar_attended", title: "", activity_date: "", role: "",
  });

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!token) {
      const stored = typeof window !== "undefined" ? localStorage.getItem("vitae_token") : null;
      if (!stored) {
        router.push("/login");
        return;
      }
    }
    loadData();
  }, [token]);

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
      const appraisalRes = await api.get(`/faculty/me/appraisal/${ACADEMIC_YEAR}`);
      setAppraisal(appraisalRes.data);
    } catch {
      setAppraisal(null);
    }
  }

  async function handleAddPublication(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/faculty/me/publications", {
      ...pubForm,
      year: pubForm.year ? parseInt(pubForm.year) : null,
      citation_count: parseInt(pubForm.citation_count) || 0,
    });
    setPubForm({ title: "", journal_or_conference: "", year: "", citation_count: "0", pub_type: "journal", is_scopus_or_wos: false, is_ugc_care: false });
    loadData();
  }

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/faculty/me/activities", {
      ...actForm,
      activity_date: actForm.activity_date || null,
    });
    setActForm({ activity_type: "seminar_attended", title: "", activity_date: "", role: "" });
    loadData();
  }

  async function handleScholarLink() {
    if (!scholarId) return;
    await api.post("/faculty/me/scholar-link", { scholar_profile_id: scholarId });
  }

  async function handleScholarSync() {
    setSyncing(true);
    try {
      await api.post("/faculty/me/scholar-sync");
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function handleSubmitAppraisal() {
    const res = await api.post(`/faculty/me/appraisal/${ACADEMIC_YEAR}`);
    setAppraisal(res.data);
  }

  async function handleDownloadPdf() {
    const res = await api.get(`/faculty/me/appraisal/${ACADEMIC_YEAR}/pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `appraisal_${ACADEMIC_YEAR}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <main className="min-h-screen bg-paper">
      <TopBar />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <Section title="Academic Performance Summary" subtitle={`Academic year ${ACADEMIC_YEAR}`}>
          {appraisal ? (
            <div className="grid grid-cols-4 gap-4 font-mono text-sm">
              <div>
                <p className="text-ink-soft text-xs">category I</p>
                <p className="text-2xl text-ink">{appraisal.category_i_score}</p>
              </div>
              <div>
                <p className="text-ink-soft text-xs">category II</p>
                <p className="text-2xl text-ink">{appraisal.category_ii_score}</p>
              </div>
              <div>
                <p className="text-ink-soft text-xs">category III</p>
                <p className="text-2xl text-ink">{appraisal.category_iii_score}</p>
              </div>
              <div>
                <p className="text-ink-soft text-xs">total</p>
                <p className="text-2xl text-maroon">{appraisal.total_api_score}</p>
              </div>
              <div className="col-span-4 mt-2">
                <span className={`px-2 py-1 text-xs font-mono uppercase ${appraisal.eligible_for_cas === "eligible" ? "bg-forest text-paper" : "bg-border text-ink-soft"}`}>
                  {appraisal.eligible_for_cas === "eligible" ? "CAS eligible" : "below CAS threshold"}
                </span>
                <span className="ml-2 px-2 py-1 text-xs font-mono uppercase border border-border text-ink-soft">
                  {appraisal.status}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-ink-soft text-sm">no appraisal submitted yet for this academic year</p>
          )}

          <div className="mt-6 flex gap-3">
            <Button onClick={handleSubmitAppraisal}>
              {appraisal ? "recalculate and resubmit" : "submit appraisal"}
            </Button>
            {appraisal && (
              <Button variant="ghost" onClick={handleDownloadPdf}>
                download PDF
              </Button>
            )}
          </div>
        </Section>

        <Section title="Google Scholar Sync" subtitle="publications auto-fetched from your scholar profile">
          <div className="flex gap-3 mb-4">
            <input
              placeholder="scholar profile id (from the url after ?user=)"
              value={scholarId}
              onChange={(e) => setScholarId(e.target.value)}
              className="flex-1"
            />
            <Button variant="ghost" onClick={handleScholarLink}>link profile</Button>
            <Button onClick={handleScholarSync} disabled={syncing}>
              {syncing ? "syncing..." : "sync now"}
            </Button>
          </div>
        </Section>

        <Section title="Research Publications">
          <table className="mb-6">
            <thead>
              <tr>
                <th>title</th>
                <th>venue</th>
                <th>year</th>
                <th>source</th>
                <th>score</th>
              </tr>
            </thead>
            <tbody>
              {publications.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>{p.journal_or_conference || "-"}</td>
                  <td className="font-mono">{p.year || "-"}</td>
                  <td className="font-mono text-xs">{p.source}</td>
                  <td className="font-mono">{p.api_score}</td>
                </tr>
              ))}
              {publications.length === 0 && (
                <tr><td colSpan={5} className="text-ink-soft text-center">no publications logged yet</td></tr>
              )}
            </tbody>
          </table>

          <form onSubmit={handleAddPublication} className="grid grid-cols-2 gap-3">
            <input placeholder="title" required value={pubForm.title} onChange={(e) => setPubForm({ ...pubForm, title: e.target.value })} className="col-span-2" />
            <input placeholder="journal / conference" value={pubForm.journal_or_conference} onChange={(e) => setPubForm({ ...pubForm, journal_or_conference: e.target.value })} />
            <input placeholder="year" type="number" value={pubForm.year} onChange={(e) => setPubForm({ ...pubForm, year: e.target.value })} />
            <select value={pubForm.pub_type} onChange={(e) => setPubForm({ ...pubForm, pub_type: e.target.value })}>
              <option value="journal">journal</option>
              <option value="conference">conference</option>
              <option value="book_chapter">book chapter</option>
              <option value="book_authored">book authored</option>
              <option value="book_edited">book edited</option>
              <option value="patent_national">patent national</option>
              <option value="patent_international">patent international</option>
            </select>
            <input placeholder="citation count" type="number" value={pubForm.citation_count} onChange={(e) => setPubForm({ ...pubForm, citation_count: e.target.value })} />
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={pubForm.is_scopus_or_wos} onChange={(e) => setPubForm({ ...pubForm, is_scopus_or_wos: e.target.checked })} />
              scopus / web of science indexed
            </label>
            <Button type="submit" className="col-span-2 w-fit">add publication</Button>
          </form>
        </Section>

        <Section title="Events, Seminars, Projects and Lectures">
          <table className="mb-6">
            <thead>
              <tr>
                <th>title</th>
                <th>type</th>
                <th>date</th>
                <th>score</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td className="font-mono text-xs">{a.activity_type.replace(/_/g, " ")}</td>
                  <td className="font-mono">{a.activity_date || "-"}</td>
                  <td className="font-mono">{a.api_score}</td>
                </tr>
              ))}
              {activities.length === 0 && (
                <tr><td colSpan={4} className="text-ink-soft text-center">no activities logged yet</td></tr>
              )}
            </tbody>
          </table>

          <form onSubmit={handleAddActivity} className="grid grid-cols-2 gap-3">
            <select value={actForm.activity_type} onChange={(e) => setActForm({ ...actForm, activity_type: e.target.value })}>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
            <input placeholder="date" type="date" value={actForm.activity_date} onChange={(e) => setActForm({ ...actForm, activity_date: e.target.value })} />
            <input placeholder="title" required value={actForm.title} onChange={(e) => setActForm({ ...actForm, title: e.target.value })} className="col-span-2" />
            <input placeholder="your role (organizer, speaker, PI, etc)" value={actForm.role} onChange={(e) => setActForm({ ...actForm, role: e.target.value })} className="col-span-2" />
            <Button type="submit" className="col-span-2 w-fit">log activity</Button>
          </form>
        </Section>
      </div>
    </main>
  );
}