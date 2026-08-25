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
    <div className="min-h-screen flex flex-col bg-base">
      <TopBar />
      <ToastContainer />

                  <main className="flex-1 max-w-[1500px] w-full mx-auto px-6 md:px-10 py-10 flex flex-col xl:flex-row gap-12">
        
        {/* LEFT COLUMN: Hero & Feed */}
        <div className="flex-1 min-w-0 flex flex-col gap-12">
          
          {/* CAS ROADMAP HERO */}
          <section className="w-full">
            {casReadiness ? (
              <div className="w-full bg-surface-1 border border-blue/20 rounded-lg shadow-sm relative">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue" />
                <div className="p-8 md:p-10 flex flex-col lg:flex-row gap-10 lg:items-center justify-between">
                  
                  {/* Left: The Roadmap */}
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-display text-text mb-3 tracking-tight">CAS Roadmap</h1>
                    <p className="text-text-secondary text-lg mb-8 font-medium">
                      {casReadiness.current_level} <span className="mx-3 text-text-tertiary font-serif">→</span> {casReadiness.target_level}
                    </p>
                    
                    <div className="w-full bg-rule rounded-sm h-2 mb-6">
                      <div 
                        className="bg-blue h-2 rounded-sm transition-all duration-1000 ease-out" 
                        style={{ width: `${casReadiness.progress_percentage}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-semibold">Years</span>
                        <span className="font-mono text-2xl text-text">{casReadiness.years_of_service_completed} <span className="text-sm text-text-ghost font-sans">/ {casReadiness.years_of_service_required}</span></span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-semibold">Publications</span>
                        <span className="font-mono text-2xl text-text">{casReadiness.publications_completed} <span className="text-sm text-text-ghost font-sans">/ {casReadiness.publications_required}</span></span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-semibold">Activities</span>
                        <span className="font-mono text-2xl text-text">{casReadiness.activities_completed} <span className="text-sm text-text-ghost font-sans">/ {casReadiness.activities_required}</span></span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right: The Score Ledger */}
                  <div className="lg:w-[320px] shrink-0 bg-base rounded-md p-6 border border-rule shadow-inner flex flex-col gap-5 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Total API Score</span>
                      <span className="font-mono text-4xl text-blue font-bold">{appraisal?.total_api_score ?? 0}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 py-4 border-y border-rule text-left">
                      <div>
                        <span className="block text-[10px] text-text-tertiary uppercase font-bold tracking-wider mb-1">Cat I</span>
                        <span className="font-mono text-lg text-text">{appraisal?.category_i_score ?? 0}</span>
                      </div>
                      <div className="border-x border-rule pl-3">
                        <span className="block text-[10px] text-text-tertiary uppercase font-bold tracking-wider mb-1">Cat II</span>
                        <span className="font-mono text-lg text-text">{appraisal?.category_ii_score ?? 0}</span>
                      </div>
                      <div className="pl-3">
                        <span className="block text-[10px] text-text-tertiary uppercase font-bold tracking-wider mb-1">Cat III</span>
                        <span className="font-mono text-lg text-text">{appraisal?.category_iii_score ?? 0}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      {casReadiness.is_ready ? (
                        <span className="text-[12px] font-bold text-green flex items-center gap-2">
                          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green"></span></span>
                          Eligible for Promotion
                        </span>
                      ) : (
                        <span className="text-[12px] font-medium text-orange flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange"></div> Requirements Pending
                        </span>
                      )}
                      {appraisal && <StatusBadge status={appraisal.status} />}
                    </div>
                  </div>

                </div>
              </div>
            ) : (
               <div className="w-full bg-surface-1 border border-rule rounded-lg shadow-sm p-10 flex justify-start items-center">
                  <p className="text-text-tertiary animate-pulse">Loading Roadmap Data...</p>
               </div>
            )}
          </section>

          {/* DOSSIER FEED */}
          <section className="w-full">
            <div className="flex items-end justify-between pb-4 border-b border-rule-strong mb-8">
              <div>
                <h2 className="text-2xl font-display text-text">Dossier Chronology</h2>
                <p className="text-[13px] text-text-tertiary mt-1">Comprehensive timeline of your academic contributions</p>
              </div>
              <div className="hidden sm:block text-right">
                <span className="text-xl font-mono text-text">{feed.length}</span>
                <span className="block text-[10px] text-text-tertiary uppercase tracking-wider">Records</span>
              </div>
            </div>

            <div className="pb-20">
              {loading ? (
                <p className="text-sm text-text-tertiary py-10 text-left animate-pulse-gentle">Loading dossier...</p>
              ) : feed.length === 0 ? (
                <EmptyState message="No records found in your dossier." action={{ label: "Add publication", onClick: () => setPubModalOpen(true) }} />
              ) : (
                <div className="flex flex-col gap-4">
                  {feed.map((item, i) => (
                    <div key={`${item.type}-${item.id}`} className={`p-6 bg-surface-1 border border-rule rounded-lg shadow-sm hover:border-rule-strong hover:shadow-md transition-all animate-in stagger-${(i % 4) + 1}`}>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-[16px] font-medium text-text leading-snug pr-6">{item.title}</h4>
                        <div className="flex flex-col items-end shrink-0 bg-base px-3 py-1.5 rounded-md border border-rule">
                          <span className="font-mono text-lg text-blue leading-none">{item.score}</span>
                          <span className="text-[9px] font-bold text-text-tertiary mt-1 uppercase">Points</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-rule-subtle">
                        <div className="flex items-center gap-4">
                          <span className="px-2.5 py-1 bg-surface-2 text-[11px] font-semibold text-text-secondary rounded-[3px]">
                            {item.meta}
                          </span>
                          <span className="text-[13px] text-text-tertiary truncate max-w-[200px] sm:max-w-[400px]">
                            {item.submeta}
                          </span>
                          {item.date_val > 0 && (
                            <span className="text-[12px] font-mono text-text-tertiary flex items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-rule-strong"></div> {item.date_val}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <button onClick={() => item.type === "publication" ? startEditPub(item) : startEditAct(item)} className="text-text-ghost hover:text-blue transition-colors flex items-center gap-1.5 text-[11px] font-medium" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg> Edit
                          </button>
                          <button onClick={() => handleDelete(item.type, item.id)} className="text-text-ghost hover:text-coral transition-colors flex items-center gap-1.5 text-[11px] font-medium" title="Remove">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Action Ribbon Tools */}
        <aside className="w-full xl:w-[320px] shrink-0 flex flex-col gap-6">
          <div className="pb-3 border-b border-rule-strong mb-2">
            <h2 className="text-lg font-display text-text">Command Tools</h2>
          </div>
          
          {/* AI Auto-fill */}
          <div className="p-5 bg-base border border-blue/20 rounded-lg shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-blue/50 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue" />
            <div className="mb-5 pl-1">
              <h3 className="text-[15px] font-medium text-text mb-1.5 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                AI Auto-fill
              </h3>
              <p className="text-[12px] text-text-tertiary leading-relaxed">
                Upload your CV. Vitae extracts and scores automatically.
              </p>
            </div>
            <div className="pl-1">
              <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleResumeUpload} />
              <Button onClick={() => fileInputRef.current?.click()} disabled={parsing} loading={parsing} variant="secondary" className="w-full text-[12px] border-blue/30 hover:border-blue hover:text-blue py-1.5 min-h-[32px]">
                {parsing ? "Analyzing PDF..." : "Upload Resume (PDF)"}
              </Button>
            </div>
          </div>

          {/* Manual Entry */}
          <div className="p-5 bg-surface-1 border border-rule rounded-lg shadow-sm flex flex-col justify-between hover:border-rule-strong transition-colors">
            <div className="mb-5">
              <h3 className="text-[15px] font-medium text-text mb-1.5 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                Manual Entry
              </h3>
              <p className="text-[12px] text-text-tertiary leading-relaxed">
                Log records individually.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setPubModalOpen(true)} className="flex-1 px-0 text-[12px] py-1.5 min-h-[32px] whitespace-nowrap">
                + Publication
              </Button>
              <Button variant="secondary" onClick={() => setActModalOpen(true)} className="flex-1 px-0 text-[12px] py-1.5 min-h-[32px] whitespace-nowrap">
                + Activity
              </Button>
            </div>
          </div>

          {/* External Sync */}
          <div className="p-5 bg-surface-1 border border-rule rounded-lg shadow-sm flex flex-col justify-between hover:border-rule-strong transition-colors">
            <div className="mb-4">
              <h3 className="text-[15px] font-medium text-text mb-1.5 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                External Sync
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input placeholder="Scholar ID" value={scholarId} onChange={(e) => setScholarId(e.target.value)} className="text-[12px] py-1 flex-1 min-w-0 px-2 rounded-sm border-rule" />
                <Button size="sm" onClick={handleScholarSync} disabled={syncing} loading={syncing} variant="secondary" className="px-3 shrink-0 text-[12px] py-1 min-h-[28px]">
                  Sync
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="file" accept=".csv" className="hidden" ref={scopusFileInputRef} onChange={handleScopusUpload} />
                <Button size="sm" onClick={() => scopusFileInputRef.current?.click()} disabled={scopusUploading} loading={scopusUploading} variant="secondary" className="w-full text-[12px] py-1 min-h-[28px]">
                  {scopusUploading ? "Importing..." : "Upload Scopus CSV"}
                </Button>
              </div>
            </div>
          </div>

          {/* Document Generation */}
          <div className="p-5 bg-surface-1 border border-rule rounded-lg shadow-sm flex flex-col justify-between hover:border-rule-strong transition-colors">
            <div className="mb-5">
              <h3 className="text-[15px] font-medium text-text mb-1.5 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brown"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                Appraisal Document
              </h3>
              <p className="text-[12px] text-text-tertiary leading-relaxed">
                Generate PBAS Proforma <span className="whitespace-nowrap font-mono">{ACADEMIC_YEAR}</span>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={handleSubmitAppraisal} loading={submitting} disabled={submitting} className="w-full text-[12px] py-1.5 min-h-[32px]">
                {appraisal ? "Recalculate Record" : "Compile Appraisal"}
              </Button>
              {appraisal && (
                <div className="flex gap-2 w-full mt-1">
                  <Button variant="secondary" onClick={() => handleDownloadPdf(true)} className="flex-1 px-0 flex gap-2 text-[11px] py-1 min-h-[28px]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    Preview
                  </Button>
                  <Button variant="secondary" onClick={() => handleDownloadPdf(false)} className="flex-1 px-0 flex gap-2 text-[11px] py-1 min-h-[28px]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
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