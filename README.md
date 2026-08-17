<div align="center">

# Vitae

**Stop counting points. Start proving impact.**

A deterministic faculty appraisal engine that computes UGC API/PBAS scores in real time,
syncs research from Google Scholar, and generates IQAC-ready dossiers — so the annual
self-appraisal stops being a spreadsheet exercise and starts being a three-minute workflow.

---

*Built for the Smart India Hackathon (SIH) — Problem Statement DJS_26_SW_07*

</div>

<br />

---

## The Problem Nobody Talks About

Every year, roughly 1.5 million faculty members across Indian universities sit down to fill out a self-appraisal form. The process looks like this:

1. Open a 12-page Word document.
2. Manually list every paper published, every seminar attended, every FDP organized.
3. Cross-reference UGC circular tables to figure out how many "API points" each item earns.
4. Add them up by hand across three separate categories.
5. Hope the HOD, IQAC coordinator, and registrar's office all agree with the arithmetic.
6. Repeat next year.

The result? Inconsistent scores, lost paperwork, arithmetic errors that delay promotions, and IQAC offices drowning in unstructured PDFs during NAAC accreditation cycles.

**The problem statement asks for a "web platform where faculty log research, events, seminars, projects, and lectures, with an admin panel to view/sort/download submissions."** Read literally, that is a CRUD app with a login screen. Every team in the room will build roughly that.

Vitae does not do that.

---

## What Vitae Actually Does

Vitae treats the appraisal not as a form to fill, but as a **score to compute**. The platform's entire architecture is built around one insight: if the UGC scoring rules are deterministic (they are), the system should calculate the score — and the faculty member should simply verify it.

### The Claimed Score Philosophy

Here is where Vitae diverges from every other appraisal tool.

A purely automated system that dictates a score without faculty input is not a *self*-appraisal. It is an audit. Vitae solves this with a dual-score architecture:

- **System Estimate** — The engine computes a score in real time using the exact UGC PBAS point tables (publication type, indexing status, citation count, activity category). This number updates live as the faculty fills out the form.
- **Claimed Score** — The faculty member sees the estimate and can accept it or override it with their own assessment. This is the number that goes on the appraisal record.

The HOD reviewing the submission sees the final claimed total. The system assists; the faculty decides. That is a true self-appraisal.

---

## Feature Inventory

### For Faculty

| Capability | What It Does |
|---|---|
| **Deterministic Scoring Engine** | Evaluates every publication and activity against UGC API tables instantly. Zero LLM hallucinations. The engine calculates base points, Scopus/WoS bonuses, and citation bonuses purely through math. |
| **AI Resume Extraction** | Drop your PDF CV into the dashboard. Vitae's backend (powered by Gemini) strictly parses your publications, categorizes them, scores them, and instantly builds your dossier. No manual typing required. |
| **Scopus & Google Scholar Sync** | Paste your Scholar profile ID, or upload a Scopus export CSV. Vitae scrapes and parses publications, citation counts, and venues automatically, deduplicating everything against your existing record. |
| **Dynamic CAS Roadmap** | A real-time tracker that constantly compares your completed years of service, publications, and activities against the strict UGC 2018 guidelines to tell you exactly how close you are to your next Academic Level promotion. |
| **Live Score Estimation** | As you fill out forms or sync data, a real-time estimate banner shows the computed UGC score before you even submit. |
| **Claimed Score Override** | Faculty can accept the system estimate or manually claim a different score if they believe their specific contribution warrants it. |
| **Three-Category Ledger** | A persistent sidebar displays Category I, Category II, and Category III scores in real time, along with the total API and CAS eligibility status. |
| **ReportLab A4 Compilation** | Generate a structured, 10-page formatted appraisal report perfectly adhering to the UGC Proforma (Parts A, B, C, D, and E), ready for IQAC submission and signatures. |

### For HODs, IQAC, and Administrators

| Capability | What It Does |
|---|---|
| **Faculty Registry** | A sortable, filterable registry of all submitted appraisals across departments. Fixed-width card layout with API scores, eligibility badges, and status indicators aligned in a strict visual grid. |
| **Department Filtering** | Filter the registry by department to review only your division's submissions. |
| **Hierarchical Approval Pipeline** | Appraisals flow through a strict chain: Faculty submits → HOD approves → IQAC finalizes. Each role can only approve submissions at their stage. |
| **Rejection with Context** | Any reviewer can reject a submission with an optional note explaining the reason. |
| **Per-Faculty PDF Access** | HODs and IQAC coordinators can preview or download any faculty member's appraisal PDF directly from the registry. |
| **Aggregate Dashboard Metrics** | The registry header shows total submissions, CAS-eligible count, and pending review count at a glance. |

### Authentication and Security

| Capability | What It Does |
|---|---|
| **JWT-Based Auth** | Stateless token authentication with role-encoded payloads. |
| **JSON Body Login** | Credentials are transmitted as a JSON request body, not query parameters — preventing accidental logging in server access logs. |
| **Role-Based Access Control** | Four roles (faculty, hod, iqac, admin) with strict endpoint-level authorization guards. |
| **Show/Hide Password Toggle** | Eye icon toggle on both Login and Register pages for accessibility. |
| **Forgot Password Flow** | Password recovery link on the login page. |

---

## The Scoring Engine — In Detail

The heart of Vitae is `pbas_engine.py`, a pure-function scoring module with zero side effects. Every point value lives in a configuration dictionary, not scattered through application logic. A registrar's office can retune the weights without touching a single route or template.

### Publication Scoring (Category III)

| Publication Type | Base Points | Scopus/WoS Bonus | Citation Bonus |
|---|---|---|---|
| Journal Article | 10 | +5 (total: 15) | +0.1 per citation, max +5 |
| Conference Paper | 5 | — | +0.1 per citation, max +5 |
| Book Chapter | 5 | — | +0.1 per citation, max +5 |
| Book Authored | 50 | — | +0.1 per citation, max +5 |
| Book Edited | 10 | — | +0.1 per citation, max +5 |
| Patent (National) | 10 | — | — |
| Patent (International) | 15 | — | — |

### Activity Scoring (Categories I and II)

| Activity Type | Category | Points |
|---|---|---|
| Teaching Course | I | 10 |
| Seminar Attended | II | 5 |
| Seminar Organized | II | 10 |
| Workshop Attended | II | 5 |
| Workshop Organized | II | 10 |
| FDP Attended | II | 5 |
| FDP Organized | II | 8 |
| Guest Lecture | II | 3 |
| Invited Talk | II | 5 |
| Committee Member | II | 3 |
| Committee Chair | II | 5 |
| Project PI (Major) | III | 20 |
| Project PI (Minor) | III | 10 |
| Project Co-Investigator | III | 8 |

### CAS Eligibility

Total API score >= **120** → Eligible for Career Advancement Scheme review.

---

## Architecture

```
vitae/
├── backend/                        # FastAPI (Python)
│   ├── app/
│   │   ├── core/
│   │   │   ├── database.py         # SQLAlchemy engine + session
│   │   │   └── security.py         # JWT creation, verification, RBAC guards
│   │   ├── models/
│   │   │   ├── user.py             # Faculty, HOD, IQAC, Admin
│   │   │   ├── publication.py      # Research outputs
│   │   │   ├── activity.py         # Seminars, workshops, FDPs, projects
│   │   │   └── appraisal.py        # Computed yearly appraisal records
│   │   ├── routers/
│   │   │   ├── auth.py             # Register + Login (JSON body)
│   │   │   ├── faculty.py          # CRUD + Scholar sync + appraisal submit
│   │   │   └── admin.py            # Registry + review pipeline + PDF access
│   │   ├── services/
│   │   │   ├── pbas_engine.py      # Deterministic UGC scoring logic
│   │   │   ├── scholar_scraper.py  # Google Scholar publication fetcher
│   │   │   └── pdf_generator.py    # ReportLab-based PDF builder
│   │   ├── schemas.py              # Pydantic request/response models
│   │   └── main.py                 # FastAPI app entrypoint
│   └── requirements.txt
│
└── frontend/                       # Next.js (TypeScript)
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx            # Landing page
    │   │   ├── login/page.tsx      # Authentication
    │   │   ├── register/page.tsx   # Faculty registration
    │   │   ├── dashboard/page.tsx  # Three-column dossier interface
    │   │   └── registry/page.tsx   # Admin/HOD/IQAC review panel
    │   ├── components/
    │   │   ├── TopBar.tsx          # Navigation header
    │   │   ├── Button.tsx          # Variant-based button system
    │   │   ├── Modal.tsx           # Dialog overlay
    │   │   ├── ScoreCard.tsx       # Score display component
    │   │   ├── StatusBadge.tsx     # Eligibility/status indicators
    │   │   ├── Toast.tsx           # Notification system
    │   │   └── EmptyState.tsx      # Zero-state placeholder
    │   └── lib/
    │       ├── api.ts              # Axios instance with JWT interceptor
    │       └── store.ts            # Zustand state management
    └── tailwind.config.ts          # Custom design token system
```

---

## Technology Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend Framework** | Next.js 16 (App Router) | Server components, file-based routing, optimized builds |
| **Language** | TypeScript | Type safety across the entire frontend surface |
| **State Management** | Zustand | Minimal boilerplate, no provider wrappers |
| **Styling** | Tailwind CSS | Custom design tokens, no arbitrary values |
| **Backend Framework** | FastAPI | Async-first, auto-generated OpenAPI docs, Pydantic validation |
| **ORM** | SQLAlchemy | Battle-tested, migration-friendly, database-agnostic |
| **Authentication** | JWT (python-jose) | Stateless, scalable, role-encoded tokens |
| **PDF Engine** | ReportLab | Programmatic PDF layout with precise table control |
| **Scholar Integration** | scholarly (Python) | Automated Google Scholar profile scraping |

---

## Design Language

Vitae was designed to break away from the dashboard templates that dominate hackathon submissions. No bento grids. No glassmorphism. No purple-on-dark. No gradient text fills.

### Typography

| Role | Typeface | Purpose |
|---|---|---|
| Display / Headlines | Fraunces | High-contrast serif with personality — makes headings feel authored, not generated |
| Body / Interface | Outfit | Geometric sans with open counters — maximum legibility at small sizes |
| Data / Scores | Chivo Mono | Tabular monospace — numbers align vertically, scores feel precise |

### Color Palette

| Token | Value | Usage |
|---|---|---|
| Base | Alabaster (#F8F5F0) | Page background — warm, paper-like, reduces eye strain |
| Blue | Yale Blue (#1A3A5C) | Structural elements, headings, navigation |
| Brown | Terracotta (#A0522D) | Action accents, interactive elements, CTA buttons |
| Sage | Muted Green (#6B8F71) | Success states, approval indicators |
| Coral | Soft Red (#CD5C5C) | Error states, rejection indicators, danger actions |

### Layout Philosophy

The faculty dashboard uses a three-column "Interactive Dossier" architecture:

- **Left Column (280px)** — Quick actions and tools. Always visible, never scrolls with content.
- **Center Column (flexible)** — The chronological feed. This is where the faculty's actual work lives.
- **Right Column (300px)** — The Score Ledger. Sticky-positioned, always showing the current category breakdown and total API score.

Every card in the admin registry uses fixed-width columns so that API scores, status badges, and action buttons form a perfectly aligned vertical grid regardless of content length.

---

## Getting Started

### Prerequisites

- Node.js v18+
- Python 3.10+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload  # Runs on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                    # Runs on http://localhost:3000
```

### Environment

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API Surface

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create a new faculty account |
| POST | `/auth/login` | Public | Authenticate and receive JWT |
| GET | `/faculty/me/publications` | Faculty | List all publications |
| POST | `/faculty/me/publications` | Faculty | Add a publication (with optional claimed_score) |
| DELETE | `/faculty/me/publications/{id}` | Faculty | Remove a publication |
| POST | `/faculty/me/scholar-link` | Faculty | Link Google Scholar profile |
| POST | `/faculty/me/scholar-sync` | Faculty | Auto-import Scholar publications |
| GET | `/faculty/me/activities` | Faculty | List all activities |
| POST | `/faculty/me/activities` | Faculty | Log an activity (with optional claimed_score) |
| DELETE | `/faculty/me/activities/{id}` | Faculty | Remove an activity |
| POST | `/faculty/me/appraisal/{year}` | Faculty | Submit/recalculate appraisal |
| GET | `/faculty/me/appraisal/{year}` | Faculty | Get appraisal for a year |
| GET | `/faculty/me/appraisal/{year}/pdf` | Faculty | Generate appraisal PDF |
| GET | `/admin/appraisals` | HOD/IQAC/Admin | List all appraisals (sortable, filterable) |
| GET | `/admin/faculty` | HOD/IQAC/Admin | List all faculty members |
| GET | `/admin/appraisals/{id}/pdf` | HOD/IQAC/Admin | Generate faculty PDF |
| PATCH | `/admin/appraisals/{id}/review` | HOD/IQAC/Admin | Approve or reject submission |

---

## Role Hierarchy

```
Faculty ──submit──> HOD ──approve──> IQAC ──finalize──> NAAC-ready
                     │                 │
                     └──reject──>      └──reject──>   (with note)
```

- **Faculty** can only see and manage their own data.
- **HOD** sees all appraisals in their department. Can approve submissions at the "submitted" stage.
- **IQAC** sees all appraisals institution-wide. Can approve submissions at the "hod_approved" stage.
- **Admin** has full registry access. Can reject at any stage.

---

## What Makes This Different

| Most Appraisal Tools | Vitae |
|---|---|
| Digitize the form exactly as-is | Compute the score the form was trying to calculate |
| Faculty manually enters points | System estimates points, faculty verifies |
| Manual data entry for publications | One-click Google Scholar sync |
| Single "download" button | Separate Preview (browser) and Download (file) |
| Generic dashboard UI | Three-column dossier with fixed-width data alignment |
| No scoring transparency | Full point table exposed in the UI during entry |
| Status: "submitted" or "not" | Four-stage pipeline: submitted → hod_approved → iqac_approved / rejected |

---

<div align="center">

*The annual appraisal should take three minutes, not three days.*

**Vitae** — because your career record deserves better than a spreadsheet.

</div>
