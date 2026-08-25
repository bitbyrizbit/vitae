"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSession, useToast } from "@/lib/store";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/Button";
import { ScoreCard } from "@/components/ScoreCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { ToastContainer } from "@/components/Toast";
import { EmptyState } from "@/components/EmptyState";

/* ---------------------------------------------------------------- types */

type FeedItem = 
  | { type: "publication"; id: number; title: string; date_val: number; score: number; meta: string; submeta: string; raw: any }
  | { type: "activity"; id: number; title: string; date_val: number; score: number; meta: string; submeta: string; raw: any };

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
  { value: "journal", label: "Journal" },
  { value: "conference", label: "Conference" },
  { value: "book_chapter", label: "Book chapter" },
  { value: "book_authored", label: "Book authored" },
  { value: "book_edited", label: "Book edited" },
  { value: "patent_national", label: "Patent (National)" },
  { value: "patent_international", label: "Patent (International)" },
];

const ACTIVITY_TYPES = [
  { value: "teaching_course", label: "Teaching course (Category I)" },
  { value: "seminar_attended", label: "Seminar attended" },
  { value: "seminar_organized", label: "Seminar organized" },
  { value: "workshop_attended", label: "Workshop attended" },
  { value: "workshop_organized", label: "Workshop organized" },
  { value: "fdp_attended", label: "FDP attended" },
  { value: "fdp_organized", label: "FDP organized" },
  { value: "guest_lecture", label: "Guest lecture" },
  { value: "invited_talk", label: "Invited talk" },
  { value: "project_pi_major", label: "Project PI (Major)" },
  { value: "project_pi_minor", label: "Project PI (Minor)" },
  { value: "project_coinvestigator", label: "Project Co-investigator" },
  { value: "committee_member", label: "Committee member" },
  { value: "committee_chair", label: "Committee chair" },
];

/* ---------------------------------------------------------------- component */

export default function DashboardPage() {
  const router = useRouter();
  const { token, hydrate, name, role } = useSession();
  const { addToast } = useToast();

  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [appraisal, setAppraisal] = useState<Appraisal | null>(null);
  const [casReadiness, setCasReadiness] = useState<any>(null);
  
  const [scholarId, setScholarId] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // modal states
  const [pubModalOpen, setPubModalOpen] = useState(false);
  const [actModalOpen, setActModalOpen] = useState(false);
  const [editingPubId, setEditingPubId] = useState<number | null>(null);
  const [editingActId, setEditingActId] = useState<number | null>(null);

  const [pubForm, setPubForm] = useState({
    title: "", journal_or_conference: "", year: "", citation_count: "0",
    pub_type: "journal", is_scopus_or_wos: false, is_ugc_care: false,
    claimed_score: "",
  });

  const [actForm, setActForm] = useState({
    activity_type: "seminar_attended", title: "", activity_date: "", role: "", description: "",
    claimed_score: "",
  });

  const computedPubScore = useMemo(() => {
    const points: Record<string, number> = {
      journal: 15, conference: 10, book_chapter: 5, book_authored: 20,
      book_edited: 10, patent_national: 10, patent_international: 15,
    };
    let base = points[pubForm.pub_type] || 10;
    if (pubForm.is_scopus_or_wos) base += 5;
    const citations = parseInt(pubForm.citation_count) || 0;
    base += Math.min(citations * 0.1, 5);
    return base;
  }, [pubForm]);

  const computedActScore = useMemo(() => {
    const points: Record<string, number> = {
      seminar_attended: 5, seminar_organized: 10, workshop_attended: 5, workshop_organized: 10,
      fdp_attended: 10, fdp_organized: 15, guest_lecture: 5, invited_talk: 10,
      project_pi_major: 20, project_pi_minor: 10, project_coinvestigator: 8,
      committee_member: 3, committee_chair: 5, teaching_course: 10,
    };
    return points[actForm.activity_type] || 0;
  }, [actForm]);

  /* ------------------------------------------------------------ auth */

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!token) {
      const stored = typeof window !== "undefined" ? localStorage.getItem("vitae_token") : null;
      if (!stored) { router.push("/login"); return; }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ------------------------------------------------------------ data loading */

  async function loadData() {
    setLoading(true);
    try {
      const [pubsRes, actsRes, appRes, casRes] = await Promise.all([
        api.get("/faculty/me/publications"),
        api.get("/faculty/me/activities"),
        api.get(`/faculty/me/appraisal/${ACADEMIC_YEAR}`).catch(() => ({ data: null })),
        api.get("/faculty/me/cas-readiness").catch(() => ({ data: null }))
      ]);
      
      // Map to unified feed
      const pubs: FeedItem[] = pubsRes.data.map((p: any) => ({
        type: "publication", id: p.id, title: p.title,
        date_val: p.year || 0, score: p.api_score,
        meta: p.pub_type.replace(/_/g, " ").charAt(0).toUpperCase() + p.pub_type.replace(/_/g, " ").slice(1),
        submeta: p.journal_or_conference || "Unknown venue",
        raw: p,
      }));
      
      const acts: FeedItem[] = actsRes.data.map((a: any) => ({
        type: "activity", id: a.id, title: a.title,
        date_val: a.activity_date ? parseInt(a.activity_date.split("-")[0]) : 0,
        score: a.api_score,
        meta: a.activity_type.replace(/_/g, " ").charAt(0).toUpperCase() + a.activity_type.replace(/_/g, " ").slice(1),
        submeta: a.activity_date || "No date",
        raw: a,
      }));

      // Sort descending by date (year)
      const combined = [...pubs, ...acts].sort((a, b) => b.date_val - a.date_val);
      setFeed(combined);
      
      if (appRes.data) setAppraisal(appRes.data);
      if (casRes.data) setCasReadiness(casRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  /* ------------------------------------------------------------ handlers */

  async function handleAddPublication(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...pubForm,
      year: pubForm.year ? parseInt(pubForm.year) : null,
      citation_count: parseInt(pubForm.citation_count) || 0,
      claimed_score: pubForm.claimed_score.trim() ? parseFloat(pubForm.claimed_score) : computedPubScore,
    };
    try {
      if (editingPubId) {
        await api.put(`/faculty/me/publications/${editingPubId}`, payload);
        addToast("Publication updated", "success");
      } else {
        await api.post("/faculty/me/publications", payload);
        addToast("Publication added", "success");
      }
      setPubModalOpen(false);
      setEditingPubId(null);
      setPubForm({ title: "", journal_or_conference: "", year: "", citation_count: "0", pub_type: "journal", is_scopus_or_wos: false, is_ugc_care: false, claimed_score: "" });
      loadData();
    } catch { addToast("Failed to save publication", "error"); }
  }

  function startEditPub(item: FeedItem) {
    const r = item.raw;
    setPubForm({
      title: r.title || "",
      journal_or_conference: r.journal_or_conference || "",
      year: r.year ? String(r.year) : "",
      citation_count: String(r.citation_count ?? 0),
      pub_type: r.pub_type || "journal",
      is_scopus_or_wos: r.is_scopus_or_wos ?? false,
      is_ugc_care: r.is_ugc_care ?? false,
      claimed_score: String(r.api_score ?? ""),
    });
    setEditingPubId(item.id);
    setPubModalOpen(true);
  }

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...actForm,
      activity_date: actForm.activity_date || null,
      description: actForm.description || null,
      claimed_score: actForm.claimed_score.trim() ? parseFloat(actForm.claimed_score) : computedActScore,
    };
    try {
      if (editingActId) {
        await api.put(`/faculty/me/activities/${editingActId}`, payload);
        addToast("Activity updated", "success");
      } else {
        await api.post("/faculty/me/activities", payload);
        addToast("Activity logged", "success");
      }
      setActModalOpen(false);
      setEditingActId(null);
      setActForm({ activity_type: "seminar_attended", title: "", activity_date: "", role: "", description: "", claimed_score: "" });
      loadData();
    } catch { addToast("Failed to save activity", "error"); }
  }

  function startEditAct(item: FeedItem) {
    const r = item.raw;
    setActForm({
      activity_type: r.activity_type || "seminar_attended",
      title: r.title || "",
      activity_date: r.activity_date || "",
      role: r.role || "",
      description: r.description || "",
      claimed_score: String(r.api_score ?? ""),
    });
    setEditingActId(item.id);
    setActModalOpen(true);
  }

  async function handleDelete(type: string, id: number) {
    try {
      await api.delete(`/faculty/me/${type === "publication" ? "publications" : "activities"}/${id}`);
      addToast("Item removed", "info");
      loadData();
    } catch { addToast("Failed to remove item", "error"); }
  }

  async function handleScholarSync() {
    setSyncing(true);
    try {
      if (scholarId.trim()) {
        await api.post("/faculty/me/scholar-link", { scholar_profile_id: scholarId.trim() });
      }
      const res = await api.post("/faculty/me/scholar-sync");
      const count = res.data?.length || 0;
      addToast(count > 0 ? `${count} new publications synced` : "No new publications found", count > 0 ? "success" : "info");
      loadData();
    } catch { addToast("Sync failed. Check your profile ID.", "error"); }
    setSyncing(false);
  }

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      addToast("Please upload a PDF file", "error");
      return;
    }

    setParsing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      addToast("AI parsing resume... This takes ~15 seconds", "info");
      const res = await api.post("/faculty/me/resume-parse", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const { publications, activities } = res.data;
      
      // Auto-save parsed data to dossier
      for (const p of publications) {
        await api.post("/faculty/me/publications", { ...p, claimed_score: p.claimed_score || 0 });
      }
      for (const a of activities) {
        await api.post("/faculty/me/activities", { ...a, claimed_score: a.claimed_score || 0 });
      }

      addToast(`Extracted ${publications.length} publications and ${activities.length} activities!`, "success");
      loadData();
    } catch (err) {
      console.error(err);
      addToast("Failed to parse resume", "error");
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmitAppraisal() {
    setSubmitting(true);
    try {
      const res = await api.post(`/faculty/me/appraisal/${ACADEMIC_YEAR}`);
      setAppraisal(res.data);
      addToast("Appraisal submitted", "success");
    } catch { addToast("Failed to submit appraisal", "error"); }
    setSubmitting(false);
  }

  async function handleDownloadPdf(preview: boolean) {
    try {
      const res = await api.get(`/faculty/me/appraisal/${ACADEMIC_YEAR}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      if (preview) {
        link.setAttribute("target", "_blank");
      } else {
        link.setAttribute("download", `appraisal_${ACADEMIC_YEAR}.pdf`);
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch { addToast("Failed to fetch PDF", "error"); }
  }

  const scopusFileInputRef = useRef<HTMLInputElement>(null);
  const [scopusUploading, setScopusUploading] = useState(false);

  async function handleScopusUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      addToast("Please upload a CSV file exported from Scopus", "error");
      return;
    }

    setScopusUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/faculty/me/scopus-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const count = res.data?.length || 0;
      addToast(count > 0 ? `${count} new publications imported from Scopus` : "No new publications found", count > 0 ? "success" : "info");
      loadData();
    } catch { addToast("Failed to parse Scopus CSV", "error"); }
    finally {
      setScopusUploading(false);
      if (scopusFileInputRef.current) scopusFileInputRef.current.value = "";
    }
  }

  /* ------------------------------------------------------------ render */

  return (
    <div className="min-h-screen flex flex-col bg-base overflow-hidden">
      <TopBar />
      <ToastContainer />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 md:px-8 flex flex-col md:flex-row gap-8 lg:gap-12 py-8 overflow-hidden">
        
        {/* Left Col: Actions & Tools */}
        <aside className="w-full md:w-[280px] shrink-0 flex flex-col gap-8 md:h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
          <div className="shrink-0">
            <h2 className="text-xl font-display text-blue mb-4">Quick actions</h2>
            <div className="flex flex-col gap-3 mb-6">
              <Button onClick={() => setPubModalOpen(true)} className="w-full justify-start">
                + Add publication
              </Button>
              <Button variant="secondary" onClick={() => setActModalOpen(true)} className="w-full justify-start">
                + Log activity
              </Button>
            </div>
          </div>

          <div className="shrink-0 p-5 bg-gradient-to-br from-surface-1 to-base border border-blue/20 rounded-[4px] shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue" />
            <h3 className="text-[15px] font-medium text-text mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
              AI Auto-fill
            </h3>
            <p className="text-[13px] text-text-tertiary mb-4 leading-relaxed">
              Upload your academic CV (PDF). Vitae will automatically extract and score all your publications and activities.
            </p>
            <input 
              type="file" 
              accept="application/pdf" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleResumeUpload} 
            />
            <Button 
              size="sm" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={parsing} 
              loading={parsing} 
              variant="secondary" 
              className="w-full border-blue/30 hover:border-blue hover:text-blue"
            >
              {parsing ? "Analyzing PDF..." : "Upload Resume (PDF)"}
            </Button>
          </div>

          <div className="shrink-0 p-5 bg-surface-1 border border-rule rounded-[4px] shadow-sm">
            <h3 className="text-[15px] font-medium text-text mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              External sync
            </h3>
            <p className="text-[13px] text-text-tertiary mb-4 leading-relaxed">
              Auto-fetch publications from Google Scholar or import a Scopus CSV export.
            </p>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <input
                  placeholder="Scholar Profile ID (e.g. jX...)"
                  value={scholarId}
                  onChange={(e) => setScholarId(e.target.value)}
                  className="text-sm py-2"
                />
                <Button size="sm" onClick={handleScholarSync} disabled={syncing} loading={syncing} variant="secondary">
                  {syncing ? "Syncing..." : "Sync Scholar"}
                </Button>
              </div>

              <div className="border-t border-rule pt-4">
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={scopusFileInputRef} 
                  onChange={handleScopusUpload} 
                />
                <Button 
                  size="sm" 
                  onClick={() => scopusFileInputRef.current?.click()} 
                  disabled={scopusUploading} 
                  loading={scopusUploading} 
                  variant="secondary" 
                  className="w-full"
                >
                  {scopusUploading ? "Importing..." : "Upload Scopus CSV"}
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Col: unified Chronological Feed */}
        <section className="flex-1 flex flex-col min-w-0 md:h-[calc(100vh-8rem)]">
          <div className="flex items-end justify-between pb-4 border-b border-rule-strong mb-6 shrink-0">
            <div>
              <h1 className="text-3xl font-display text-blue">Dossier feed</h1>
              <p className="text-[14px] text-text-tertiary mt-1">Chronological record of your work</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 no-scrollbar pb-10">
            {loading ? (
              <p className="text-sm text-text-tertiary py-10 text-center animate-pulse-gentle">Loading dossier...</p>
            ) : feed.length === 0 ? (
              <EmptyState message="No records found in your dossier." action={{ label: "Add publication", onClick: () => setPubModalOpen(true) }} />
            ) : (
              <div className="flex flex-col gap-4">
                {feed.map((item, i) => (
                  <div key={`${item.type}-${item.id}`} className={`p-5 bg-surface-1 border border-rule rounded-[4px] shadow-sm hover:border-rule-strong transition-colors animate-in stagger-${(i % 4) + 1}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-[16px] font-medium text-text leading-snug pr-4">{item.title}</h4>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="font-mono text-xl text-blue leading-none">{item.score}</span>
                        <span className="text-[11px] font-mono text-text-tertiary mt-1">PTS</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-rule-subtle">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-surface-2 text-[12px] font-medium text-text-secondary rounded-[3px]">
                          {item.meta}
                        </span>
                        <span className="text-[13px] text-text-tertiary truncate max-w-[200px] sm:max-w-[300px]">
                          {item.submeta}
                        </span>
                        {item.date_val > 0 && (
                          <span className="text-[13px] font-mono text-text-tertiary">
                            • {item.date_val}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => item.type === "publication" ? startEditPub(item) : startEditAct(item)}
                          className="text-text-ghost hover:text-blue transition-colors"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.type, item.id)}
                          className="text-text-ghost hover:text-coral transition-colors"
                          title="Remove"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right Col: Ledger & Roadmap */}
        <aside className="w-full md:w-[300px] shrink-0 flex flex-col gap-6 md:h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
          {casReadiness && (
            <div className="shrink-0 p-6 bg-surface-1 border border-blue/30 rounded-[4px] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue to-orange" />
              <h2 className="text-xl font-display text-text mb-2 flex items-center gap-2">
                CAS Roadmap
              </h2>
              <p className="text-[13px] text-text-tertiary mb-5 leading-tight">
                {casReadiness.current_level} → {casReadiness.target_level}
              </p>
              
              <div className="flex flex-col gap-4">
                <div className="w-full bg-rule rounded-full h-2">
                  <div 
                    className="bg-blue h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${casReadiness.progress_percentage}%` }}
                  ></div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-text-secondary">Years in service</span>
                    <span className="font-mono text-text">{casReadiness.years_of_service_completed}/{casReadiness.years_of_service_required}</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-text-secondary">Publications</span>
                    <span className="font-mono text-text">{casReadiness.publications_completed}/{casReadiness.publications_required}</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-text-secondary">Activities / Courses</span>
                    <span className="font-mono text-text">{casReadiness.activities_completed}/{casReadiness.activities_required}</span>
                  </div>
                </div>
                
                <div className="pt-2">
                  {casReadiness.is_ready ? (
                    <div className="text-[13px] font-medium text-green bg-green/10 p-2 rounded text-center border border-green/20">
                      Eligible for promotion!
                    </div>
                  ) : (
                    <div className="text-[13px] text-text-tertiary text-center">
                      Complete requirements to advance.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="shrink-0 p-6 bg-surface-1 border border-rule-strong rounded-[4px] shadow-sm sticky top-0">
            <h2 className="text-xl font-display text-blue border-b border-rule pb-3 mb-5">Score ledger</h2>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-text-secondary">Category I</span>
                <span className="font-mono text-lg text-text">{appraisal?.category_i_score ?? 0}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-text-secondary">Category II</span>
                <span className="font-mono text-lg text-text">{appraisal?.category_ii_score ?? 0}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-text-secondary">Category III</span>
                <span className="font-mono text-lg text-text">{appraisal?.category_iii_score ?? 0}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-rule mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-text">Total API</span>
                <span className="font-mono text-3xl text-brown">{appraisal?.total_api_score ?? 0}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {appraisal ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-text-tertiary">Eligibility</span>
                    <StatusBadge status={appraisal.eligible_for_cas} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-text-tertiary">Appraisal status</span>
                    <StatusBadge status={appraisal.status} />
                  </div>
                </>
              ) : (
                <p className="text-[13px] text-text-tertiary italic">No appraisal submitted for {ACADEMIC_YEAR}</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleSubmitAppraisal}
                loading={submitting}
                disabled={submitting}
                className="w-full"
              >
                {appraisal ? "Recalculate record" : "Submit appraisal"}
              </Button>
              {appraisal && (
                <div className="flex gap-2 w-full">
                  <Button variant="secondary" onClick={() => handleDownloadPdf(true)} className="flex-1 px-0 flex gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    Preview
                  </Button>
                  <Button variant="secondary" onClick={() => handleDownloadPdf(false)} className="flex-1 px-0 flex gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Download
                  </Button>
                </div>
              )}
            </div>
          </div>
        </aside>

      </main>

      {/* Modals */}
      <Modal open={pubModalOpen} onClose={() => { setPubModalOpen(false); setEditingPubId(null); setPubForm({ title: "", journal_or_conference: "", year: "", citation_count: "0", pub_type: "journal", is_scopus_or_wos: false, is_ugc_care: false, claimed_score: "" }); }} title={editingPubId ? "Edit publication" : "Add a publication"}>
        <form onSubmit={handleAddPublication} className="space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">Title</label>
            <input required value={pubForm.title} onChange={(e) => setPubForm({ ...pubForm, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-2">Venue / Journal</label>
              <input value={pubForm.journal_or_conference} onChange={(e) => setPubForm({ ...pubForm, journal_or_conference: e.target.value })} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-2">Year</label>
              <input type="number" value={pubForm.year} onChange={(e) => setPubForm({ ...pubForm, year: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-2">Publication type</label>
              <select value={pubForm.pub_type} onChange={(e) => setPubForm({ ...pubForm, pub_type: e.target.value })}>
                {PUB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-2">Citation count</label>
              <input type="number" value={pubForm.citation_count} onChange={(e) => setPubForm({ ...pubForm, citation_count: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input type="checkbox" checked={pubForm.is_scopus_or_wos} onChange={(e) => setPubForm({ ...pubForm, is_scopus_or_wos: e.target.checked })} />
              Scopus / Web of Science indexed
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input type="checkbox" checked={pubForm.is_ugc_care} onChange={(e) => setPubForm({ ...pubForm, is_ugc_care: e.target.checked })} />
              UGC care listed
            </label>
          </div>
          <div className="pt-4 border-t border-rule mt-2">
            <div className="flex items-center justify-between bg-surface-2 rounded-[4px] px-4 py-3 mb-4">
              <div>
                <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wide">System estimate</p>
                <p className="text-[13px] text-text-secondary mt-0.5">Based on UGC PBAS guidelines</p>
              </div>
              <span className="font-mono text-2xl text-blue font-semibold">{computedPubScore}</span>
            </div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">Your claimed score</label>
            <input 
              type="number" 
              step="0.1"
              value={pubForm.claimed_score} 
              onChange={(e) => setPubForm({ ...pubForm, claimed_score: e.target.value })} 
              placeholder={`${computedPubScore} (defaults to estimate)`}
            />
            <p className="text-[12px] text-text-tertiary mt-1.5">Adjust if you believe your contribution warrants a different score.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-rule mt-2">
            <Button variant="ghost" type="button" onClick={() => setPubModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingPubId ? "Save changes" : "Add publication"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={actModalOpen} onClose={() => { setActModalOpen(false); setEditingActId(null); setActForm({ activity_type: "seminar_attended", title: "", activity_date: "", role: "", description: "", claimed_score: "" }); }} title={editingActId ? "Edit activity" : "Log an activity"}>
        <form onSubmit={handleAddActivity} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-2">Activity type</label>
              <select value={actForm.activity_type} onChange={(e) => setActForm({ ...actForm, activity_type: e.target.value })}>
                {ACTIVITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-2">Date</label>
              <input type="date" value={actForm.activity_date} onChange={(e) => setActForm({ ...actForm, activity_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">Title</label>
            <input required value={actForm.title} onChange={(e) => setActForm({ ...actForm, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">Your role (Organizer, PI, etc.)</label>
            <input value={actForm.role} onChange={(e) => setActForm({ ...actForm, role: e.target.value })} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">Description (Optional)</label>
            <textarea rows={3} value={actForm.description} onChange={(e) => setActForm({ ...actForm, description: e.target.value })} />
          </div>
          <div className="pt-4 border-t border-rule mt-2">
            <div className="flex items-center justify-between bg-surface-2 rounded-[4px] px-4 py-3 mb-4">
              <div>
                <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wide">System estimate</p>
                <p className="text-[13px] text-text-secondary mt-0.5">Based on UGC PBAS guidelines</p>
              </div>
              <span className="font-mono text-2xl text-blue font-semibold">{computedActScore}</span>
            </div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">Your claimed score</label>
            <input 
              type="number" 
              step="0.1"
              value={actForm.claimed_score} 
              onChange={(e) => setActForm({ ...actForm, claimed_score: e.target.value })} 
              placeholder={`${computedActScore} (defaults to estimate)`}
            />
            <p className="text-[12px] text-text-tertiary mt-1.5">Adjust if you believe your contribution warrants a different score.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-rule mt-2">
            <Button variant="ghost" type="button" onClick={() => setActModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingActId ? "Save changes" : "Log activity"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}