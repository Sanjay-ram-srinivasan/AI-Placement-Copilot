<div align="center">

<h1>🚀 AI Placement & Learning Copilot</h1>

<h3>
AI Resume Intelligence • Skill Gap Analysis • Learning Roadmaps • Career Guidance
</h3>

</div>

<div align="center">


<br/>

<!-- Status & Meta Badges -->
<p>
  <img src="https://img.shields.io/badge/Status-Active%20Development-58a6ff?style=for-the-badge&logo=statuspage&logoColor=white"/>
  <img src="https://img.shields.io/badge/License-MIT-a371f7?style=for-the-badge&logo=opensourceinitiative&logoColor=white"/>
  <img src="https://img.shields.io/badge/PRs-Welcome-00C7B7?style=for-the-badge&logo=github&logoColor=white"/>
  <img src="https://img.shields.io/badge/Version-1.0.0-FF6C37?style=for-the-badge"/>
</p>

<!-- Stack Badges Row 1 -->
<p>
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white"/>
  <img src="https://img.shields.io/badge/React.js-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/>
  
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white"/>
</p>

<!-- Stack Badges Row 2 — AI -->
<p>
  <img src="https://img.shields.io/badge/Groq_Cloud-F55036?style=for-the-badge&logo=thunderbird&logoColor=white"/>
  <img src="https://img.shields.io/badge/Llama_3.3_70B-7B2FBE?style=for-the-badge&logo=meta&logoColor=white"/>
  <img src="https://img.shields.io/badge/DeepSeek_R1-1C6EF2?style=for-the-badge&logo=deepnote&logoColor=white"/>
  <img src="https://img.shields.io/badge/ChromaDB-FF6B6B?style=for-the-badge&logo=databricks&logoColor=white"/>
  <img src="https://img.shields.io/badge/RAG_Architecture-00C7B7?style=for-the-badge&logo=openai&logoColor=white"/>
</p>

<br/>

[![Stars](https://img.shields.io/github/stars/Sanjay-Ram-Srinivasan/ai-placement-copilot?style=for-the-badge&color=FFD700)](https://github.com/Sanjay-Ram-Srinivasan/ai-placement-copilot/stargazers)
[![Forks](https://img.shields.io/github/forks/Sanjay-Ram-Srinivasan/ai-placement-copilot?style=for-the-badge&color=58a6ff)](https://github.com/Sanjay-Ram-Srinivasan/ai-placement-copilot/fork)
[![Issues](https://img.shields.io/github/issues/Sanjay-Ram-Srinivasan/ai-placement-copilot?style=for-the-badge&color=a371f7)](https://github.com/Sanjay-Ram-Srinivasan/ai-placement-copilot/issues)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Core Features](#-core-features)
- [AI Models](#-ai-models)
- [System Architecture](#-system-architecture)
- [AI & RAG Workflow](#-ai--rag-workflow)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Installation Guide](#️-installation-guide)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 📌 Overview

**AI Placement & Learning Copilot** is a production-grade, AI-powered career development platform engineered for students preparing for technical placements. The system integrates **Large Language Models via Groq Cloud**, a **Retrieval-Augmented Generation (RAG)** pipeline backed by **ChromaDB**, and a structured **Flask REST API** to deliver intelligent, personalized placement preparation at scale.

The platform performs deep resume intelligence, semantic skill gap detection against target job roles, structured learning roadmap generation, and LLM-driven interview preparation — all surfaced through a React.js dashboard with real-time analytics.

**Core design principles:**

- 🧠 **LLM-first architecture** — Groq-hosted Llama 3.3 70B and DeepSeek R1 power all reasoning and generation tasks
- 🔍 **RAG over static generation** — ChromaDB vector retrieval grounds every LLM output in relevant, retrieved context
- 🔐 **Stateless API design** — JWT-authenticated REST endpoints with clean separation of concerns
- 📊 **Observable by default** — every AI output is structured, parseable, and logged for analytics

---

## ✨ Core Features

| Feature | Description |
|---------|-------------|
| 📄 **AI Resume Intelligence** | Parses and scores resumes using NLP — extracts entities, evaluates structure, and computes ATS compatibility scores |
| 🔍 **Semantic Skill Gap Analysis** | Embeds user skill profiles and job descriptions into vector space; measures semantic distance to surface actionable gaps |
| 🧭 **Personalized Learning Roadmaps** | Generates role-specific, sequenced learning plans via LLM reasoning over retrieved course and skill data |
| 💬 **LLM-Powered Career Guidance** | Conversational AI interface backed by Llama 3.3 70B for deep career strategy, company research, and guidance |
| 🎯 **Job Role Recommendation System** | Semantic matching between user profile embeddings and role requirement vectors to surface best-fit roles |
| 📚 **AI-Curated Learning Resources** | RAG-enhanced resource curation — retrieves and ranks the most relevant courses, papers, and projects per skill gap |
| 🧪 **Interview Preparation Engine** | Generates structured, role-specific technical and behavioral interview Q&A using DeepSeek R1 reasoning |
| 📊 **Placement Readiness Analytics** | Tracks skill acquisition, roadmap progress, and placement readiness metrics in a visual dashboard |

---

## 🤖 AI Models

| Model | Provider | Role in Pipeline |
|-------|----------|-----------------|
| **Llama 3.3 70B** | Groq Cloud | Career guidance, roadmap generation, conversational Q&A |
| **DeepSeek R1** | Groq Cloud | Skill gap analysis, structured reasoning, interview prep |
| **ChromaDB Embeddings** | Local / ChromaDB | Semantic vector indexing and top-K retrieval |
| **RAG Pipeline** | Custom | Context augmentation for all LLM inference tasks |

> All LLM inference is served via **Groq Cloud** — delivering ultra-low latency on open-weight models.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│                   React.js  +  Tailwind CSS  +  Vite                │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  HTTPS / REST
┌──────────────────────────────▼──────────────────────────────────────┐
│                        API GATEWAY LAYER                            │
│                   Flask REST API  +  JWT Auth                       │
└──────┬─────────────────────┬──────────────────────┬────────────────┘
       │                     │                      │
┌──────▼──────┐    ┌─────────▼──────────┐   ┌──────▼───────────────┐
│  RESUME     │    │    RAG ENGINE      │   │   DATA LAYER         │
│  SERVICE    │    │                    │   │                      │
│             │    │  ChromaDB          │   │  MySQL               │
│ PDF Parser  │    │  (Vector Store)    │   │  User Profiles       │
│ NLP Extract │    │       ↓            │   │  Resumes             │
│ ATS Scorer  │    │  Context Builder   │   │  Roadmaps            │
└─────────────┘    │       ↓            │   │  Analytics           │
                   │  ┌────────────┐    │   └──────────────────────┘
                   │  │ GROQ CLOUD │    │
                   │  │            │    │
                   │  │ Llama 3.3  │    │
                   │  │    70B     │    │
                   │  │            │    │
                   │  │ DeepSeek   │    │
                   │  │    R1      │    │
                   │  └────────────┘    │
                   └────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
  Resume Analysis    Skill Gap Detection   Roadmap Generation
  Career Guidance    Interview Prep        Job Recommendations
```

---

## 🤖 AI & RAG Workflow

```
  User Input (Resume PDF + Target Role)
               │
               ▼
     ┌─────────────────┐
     │   PDF Parser    │  ← PyMuPDF / pdfplumber
     └────────┬────────┘
              │ Raw Text
              ▼
     ┌─────────────────┐
     │ Skill Extractor │  ← NLP entity recognition
     └────────┬────────┘
              │ Structured Skills
              ▼
     ┌─────────────────┐
     │   Embeddings    │  ← sentence-transformers
     └────────┬────────┘
              │ Dense Vectors
              ▼
     ┌─────────────────┐
     │    ChromaDB     │  ← Top-K semantic retrieval
     │  (Vector Store) │     over job roles, courses,
     └────────┬────────┘     skill taxonomies
              │ Retrieved Context Chunks
              ▼
     ┌─────────────────┐
     │ Prompt Assembly │  ← Context + user data + system prompt
     └────────┬────────┘
              │ Augmented Prompt
              ▼
     ┌──────────────────────────────────┐
     │          GROQ CLOUD              │
     │                                  │
     │  Llama 3.3 70B  │  DeepSeek R1  │
     │  (Guidance,     │  (Gap Analysis,│
     │   Roadmaps)     │   Interview)   │
     └────────┬─────────────────────────┘
              │ Structured JSON Response
              ▼
     ┌─────────────────┐
     │ Response Parser │  ← Validation + DB write
     └────────┬────────┘
              │
     ┌────────▼─────────────────────────────┐
     │           Frontend Dashboard         │
     │  Skill Gaps │ Roadmap │ Chat │ Stats │
     └──────────────────────────────────────┘
```

**Prompt Engineering Techniques Applied:**
- System-role prompting for deterministic JSON output
- Few-shot examples in gap analysis prompts
- Chain-of-thought for roadmap step sequencing
- RAG context injection with source attribution

---

## 🛠️ Tech Stack

<div align="center">

### Frontend
![React](https://img.shields.io/badge/React.js-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

### Backend
![Python](https://img.shields.io/badge/Python_3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-CC2927?style=for-the-badge&logo=sqlalchemy&logoColor=white)

### AI & Vector
![Groq](https://img.shields.io/badge/Groq_Cloud-F55036?style=for-the-badge&logo=thunderbird&logoColor=white)
![Llama](https://img.shields.io/badge/Llama_3.3_70B-7B2FBE?style=for-the-badge&logo=meta&logoColor=white)
![DeepSeek](https://img.shields.io/badge/DeepSeek_R1-1C6EF2?style=for-the-badge&logo=deepnote&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-FF6B6B?style=for-the-badge&logo=databricks&logoColor=white)

### Database & Infra
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

</div>

---


---

## 📁 Project Structure

```
ai-placement-copilot/
│
├── 📁 frontend/                        # React.js + Vite + Tailwind
│   ├── 📁 src/
│   │   ├── 📁 components/              # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── ResumeUploader.jsx
│   │   │   ├── SkillGapChart.jsx
│   │   │   ├── RoadmapStepper.jsx
│   │   │   └── ChatInterface.jsx
│   │   ├── 📁 pages/                   # Route-level page views
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ResumeAnalyzer.jsx
│   │   │   ├── SkillGap.jsx
│   │   │   ├── Roadmap.jsx
│   │   │   ├── CareerChat.jsx
│   │   │   └── Login.jsx
│   │   ├── 📁 services/
│   │   │   └── api.js                  # Axios API client
│   │   └── App.jsx
│   ├── vite.config.js
│   └── package.json
│
├── 📁 backend/
│   ├── 📁 app/
│   │   │
│   │   ├── 📁 api/                     # Flask route blueprints
│   │   │   ├── auth.py                 # Register, login, token refresh
│   │   │   ├── resume.py               # Upload, parse, score
│   │   │   ├── skill_gap.py            # Gap detection endpoints
│   │   │   ├── roadmap.py              # Roadmap generation
│   │   │   ├── chat.py                 # Career guidance chat
│   │   │   └── analytics.py            # Dashboard metrics
│   │   │
│   │   ├── 📁 services/                # Business logic layer
│   │   │   ├── resume_parser.py        # PDF text extraction
│   │   │   ├── skill_extractor.py      # NLP entity extraction
│   │   │   ├── rag_engine.py           # RAG pipeline orchestration
│   │   │   ├── groq_client.py          # Groq API wrapper (Llama + DeepSeek)
│   │   │   ├── vector_store.py         # ChromaDB read/write operations
│   │   │   └── roadmap_builder.py      # Roadmap assembly logic
│   │   │
│   │   ├── 📁 models/                  # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── resume.py
│   │   │   ├── skill_gap.py
│   │   │   └── roadmap.py
│   │   │
│   │   └── 📁 utils/
│   │       ├── validators.py
│   │       └── helpers.py
│   │
│   ├── 📁 vector_store/                # ChromaDB persistent storage
│   │   └── chroma_db/                  # Embeddings & collections (gitignored)
│   │
│   ├── 📁 uploads/                     # Temporary resume storage (gitignored)
│   ├── requirements.txt
│   ├── config.py
│   └── app.py                          # Flask application entry point
│
├── 📁 docs/
│   ├── architecture.md
│   ├── api_reference.md
│   └── deployment.md
│
├
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## ⚙️ Installation Guide

### Prerequisites

| Tool | Version |
|------|---------|
| Python | `3.11+` |
| Node.js | `18+` |
| MySQL | `8.0+` |
| Git | Latest |
| Docker | Optional |

---

### 1. Clone the Repository

```bash
git clone https://github.com/Sanjay-Ram-Srinivasan/ai-placement-copilot.git
cd ai-placement-copilot
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (macOS/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

### 3. Database Setup

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE ai_placement_copilot;
EXIT;

# Run migrations
flask db upgrade
```

---

### 4. Frontend Setup

```bash
cd ../frontend
npm install
```

---

### 5. Run the Application

**Terminal 1 — Backend**
```bash
cd backend
source venv/bin/activate
flask run --host=0.0.0.0 --port=5000
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```

**App:** `http://localhost:5173`
**API:** `http://localhost:5000/api/v1`

---

### Docker (Alternative)

```bash
docker-compose up --build
```

---

## 🔑 Environment Variables

Create a `.env` file in `/backend`:

```env
# ─── Flask Core ──────────────────────────────────
SECRET_KEY=your_flask_secret_key_here
FLASK_ENV=development

# ─── Authentication ──────────────────────────────
JWT_SECRET_KEY=your_jwt_secret_key_here

# ─── Database ────────────────────────────────────
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=ai_placement_copilot

# ─── AI / LLM ────────────────────────────────────
GROQ_API_KEY=your_groq_api_key_here

# ─── Vector Database ─────────────────────────────
CHROMA_DB_PATH=./vector_store/chroma_db
```

Create a `.env` in `/frontend`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

> ⚠️ Never commit `.env` files. Use `.env.example` for version control.

---

## 📡 API Reference

**Base URL:** `http://localhost:5000/api/v1`

### 🔐 Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Register new user account | ❌ |
| `POST` | `/auth/login` | Authenticate and receive JWT | ❌ |
| `POST` | `/auth/refresh` | Refresh access token | ✅ |
| `POST` | `/auth/logout` | Invalidate session | ✅ |

### 📄 Resume

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/resume/upload` | Upload and parse resume PDF | ✅ |
| `GET`  | `/resume/analysis` | Retrieve latest resume analysis | ✅ |
| `GET`  | `/resume/score` | Fetch ATS compatibility score | ✅ |

### 🔍 Skill Gap

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/skills/gap-detect` | Run gap analysis for a target role | ✅ |
| `GET`  | `/skills/gaps` | Get saved gap results | ✅ |

**Sample Request:**
```json
POST /api/v1/skills/gap-detect

{
  "target_role": "Machine Learning Engineer",
  "experience_level": "fresher"
}
```

**Sample Response:**
```json
{
  "status": "success",
  "target_role": "Machine Learning Engineer",
  "matched_skills": ["Python", "NumPy", "Pandas", "Scikit-learn"],
  "missing_skills": [
    { "skill": "MLflow", "priority": "high" },
    { "skill": "Kubernetes", "priority": "medium" },
    { "skill": "Distributed Training", "priority": "low" }
  ],
  "match_score": 47,
  "model_used": "deepseek-r1",
  "roadmap_available": true
}
```

### 🧭 Roadmap

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/roadmap/generate` | Generate personalized learning roadmap | ✅ |
| `GET`  | `/roadmap/` | Retrieve current roadmap | ✅ |
| `PATCH`| `/roadmap/progress` | Update step completion | ✅ |

### 💬 Career Chat

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/chat/query` | Send message to AI career mentor | ✅ |
| `GET`  | `/chat/history` | Retrieve conversation history | ✅ |

**Sample Request:**
```json
POST /api/v1/chat/query

{
  "message": "How should I prepare for a Data Engineer role at a product company?",
  "context": "resume_analysis"
}
```

**Sample Response:**
```json
{
  "response": "Based on your resume, you have a strong Python foundation...",
  "model_used": "llama-3.3-70b",
  "sources_retrieved": 4,
  "tokens_used": 312
}
```

### 📊 Analytics

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET`  | `/analytics/dashboard` | Fetch all dashboard metrics | ✅ |
| `GET`  | `/analytics/progress` | Roadmap completion timeline | ✅ |

---

## 🔮 Future Enhancements

| Priority | Feature | Description |
|----------|---------|-------------|
| 🔴 High | **Multi-Agent Career Assistant** | LangGraph-based agentic pipeline — resume agent, skill agent, roadmap agent working in coordination |
| 🔴 High | **Placement Readiness Score** | Composite scoring model combining skill match, project quality, and ATS rating |
| 🟡 Medium | **AI Mock Interview Simulator** | Real-time conversational interview with structured evaluation and feedback |
| 🟡 Medium | **Company-Specific Interview Prep** | Retrieval-augmented prep packs for FAANG, startups, and product companies |
| 🟡 Medium | **LinkedIn Profile Analyzer** | Semantic audit of LinkedIn profiles against target roles |
| 🟢 Planned | **Voice-Based Career Mentor** | Speech-to-text + LLM response + TTS for voice-first guidance |
| 🟢 Planned | **AI Resume Builder** | LLM-generated, role-optimized resume with ATS scoring |
| 🟢 Planned | **Recruiter Dashboard** | Placement cell portal for batch-level analytics and student tracking |
| 🟢 Planned | **Mobile Application** | React Native companion app for on-the-go prep |

---

## 🤝 Contributing

Contributions are welcome and encouraged. Here's how to get involved:

### Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/ai-placement-copilot.git
cd ai-placement-copilot
git checkout -b feature/your-feature-name
```

### Make Changes & Commit

```bash
git add .
git commit -m "feat: describe what you added"
git push origin feature/your-feature-name
```

Then open a **Pull Request** against the `main` branch.

### Commit Message Convention

| Prefix | When to Use |
|--------|-------------|
| `feat:` | New feature or capability |
| `fix:` | Bug fix |
| `docs:` | Documentation only changes |
| `refactor:` | Code restructure, no behavior change |
| `chore:` | Build scripts, tooling, configs |
| `test:` | Add or update tests |
| `perf:` | Performance improvement |

### Contribution Areas

- 🐛 Bug reports via [Issues](https://github.com/Sanjay-Ram-Srinivasan/ai-placement-copilot/issues)
- 💡 Feature proposals via Issues (label: `enhancement`)
- 📝 Documentation improvements
- 🧪 Test coverage
- 🌐 UI/UX enhancements

Please read `CONTRIBUTING.md` before submitting a PR.

---

## 📄 License

```
MIT License

Copyright (c) 2025 Sanjay Ram Srinivasan

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 📬 Contact

<div align="center">

**Sanjay Ram Srinivasan**
*AI & Machine Learning Student*
*Vellore Institute of Technology – Andhra Pradesh*

<br/>

[![GitHub](https://img.shields.io/badge/GitHub-Sanjay--Ram--Srinivasan-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Sanjay-Ram-Srinivasan)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)]([https://linkedin.com/in/sanjay-ram-srinivasan](https://www.linkedin.com/in/sanjay-ram-s-498681369/))
[![Gmail](https://img.shields.io/badge/Gmail-Contact-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:sanjaysrinivasan.ram@gmail.com)

<br/>

*Open to AI/ML internship opportunities, research collaborations, and open-source contributions.*

</div>

---

<div align="center">

*If this project is useful to you, a ⭐ on the repository is appreciated.*

<br/>

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:533483,50:0f3460,100:0d1117&height=120&section=footer&animation=fadeIn"/>

</div>
