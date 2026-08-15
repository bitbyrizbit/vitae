<div align="center">
  <h1 align="center">Vitae</h1>
  <p align="center">
    <strong>The deterministic faculty appraisal and API scoring engine.</strong>
  </p>
  <p align="center">
    Designed for UGC PBAS, CAS Promotions, and NAAC Accreditation.
  </p>
</div>

<br />

## 📖 Overview

**Vitae** is a high-fidelity faculty self-appraisal platform engineered to digitize, compute, and streamline the academic performance review process. It does not merely digitize a physical form; it acts as an intelligent assistant that automatically computes the point-based score (API/PBAS) used by the University Grants Commission (UGC) for faculty promotion. 

By automating score calculations, synchronizing with external research databases, and generating publication-ready dossiers, Vitae completely eliminates the manual friction and mathematical discrepancies historically associated with academic appraisals.

---

## ✨ Core Capabilities

### 1. Deterministic Scoring Engine
Vitae features a built-in algorithm that evaluates publications, events, and projects against UGC guidelines in real-time. It accurately computes base points, indexing bonuses (Scopus/Web of Science), and citation multipliers instantly.

### 2. True Self-Appraisal Philosophy
While Vitae calculates a precise "System Recommended Score" based on institutional rules, it respects the autonomy of the faculty member. The platform allows faculty to assert a **Claimed Score**, ensuring the system acts as a smart assistant rather than a rigid black box.

### 3. Google Scholar Synchronization
Manual data entry is prone to errors and fatigue. Vitae integrates a single-click sync mechanism that automatically pulls research publications, venues, and citation counts directly from Google Scholar profiles, mapping them instantly to the appraisal dossier.

### 4. Interactive Dossier UI
The frontend features a meticulously crafted three-column architecture designed for maximum legibility and frictionless navigation:
- **Quick Actions:** Immediate access to logging and synchronization tools.
- **Chronological Feed:** A unified timeline of all academic contributions and research.
- **Score Ledger:** A sticky, real-time cryptographic ledger displaying Category I, II, III, and total API scores alongside CAS eligibility status.

### 5. Institutional Review Pipeline
Vitae enforces a strict, hierarchical role-based access control (RBAC) system:
- **Faculty:** Compile and submit self-appraisals.
- **Head of Department (HOD):** Review, verify, and approve departmental submissions.
- **Internal Quality Assurance Cell (IQAC):** Finalize verifications for NAAC accreditation.
- **Administrator:** Manage global registry and system integrity.

### 6. High-Fidelity PDF Generation
At the click of a button, Vitae compiles a faculty member's entire year of academic contributions into a structured, highly formatted PDF report tailored exactly for institutional IQAC offices and external accreditation bodies.

---

## 🛠️ Technology Stack

**Frontend Architecture**
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom Editorial Design System)

**Backend Architecture**
- **Framework:** FastAPI (Python)
- **Database:** SQLAlchemy (ORM)
- **PDF Generation:** ReportLab
- **Authentication:** JWT (JSON Web Tokens) with JSON payload security

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python (3.10 or higher)

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn app.main:app --reload
```
*The backend will be available at `http://localhost:8000`.*

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
*The frontend will be available at `http://localhost:3000`.*

---

## 🎨 Design Philosophy

Vitae breaks away from conventional, uninspired dashboard templates. The user interface was engineered from the ground up to feel like a premium, international-grade web application:
- **Typography:** Display elements utilize *Fraunces*, body text relies on *Outfit*, and precise data/scores are rendered in *Chivo Mono*.
- **Palette:** A refined light theme utilizing Alabaster base colors, Yale Blue structural elements, and Terracotta Brown action accents.
- **Layout:** Rejects bento-grids and glassmorphism in favor of structured, editorial column layouts that prioritize data hierarchy and readability.

---

<div align="center">
  <i>Engineered for the Smart India Hackathon (SIH).</i>
</div>
