# Orca Sub-App Playbook

> **For marketers, PMs, and solution engineers.**
> You don't need to read 49 individual skill files. Start here.

---

## How This Works

Orca sub-apps are built by AI agents using **skills** — pre-written instruction sets that teach the agent how to implement specific features. Think of skills as LEGO bricks: you pick the ones you need, and the agent assembles them.

This playbook shows you **which bricks to pick** for common app scenarios.

---

## 🚀 Quick-Start Tutorials

### Tutorial 1: Build Your First Orca App (20 min)

**You'll end up with:** A working sub-app deployed inside the Orca host, with a page, routing, and proper branding.

| Step | What happens | Skill used |
|------|-------------|------------|
| 1. Describe your app | Answer 2–3 questions about what your app does | `guide-react-app` |
| 2. Generate the code | Agent scaffolds all files, installs deps | `create-orca-sub-app` |
| 3. Apply the design system | Pages get the Liquid Metal look & feel | `orca-fe-liquid` |
| 4. Build & review | Automated build, 7-category code review, zip archive | `build-orca-sub-app` |
| 5. Register in Orca | Get the exact registry fields to paste into the host | `register-orca-sub-app` |

**Just say:** *"Build me an Orca app that [does X]"* — the agent handles the rest.

---

### Tutorial 2: Add a New Page to an Existing App

**You'll end up with:** A new routed page using the Liquid Metal design system.

| Step | What happens | Skill used |
|------|-------------|------------|
| 1. Describe the page | Tell the agent what the page shows/does | `scaffold-orca-sub-app` |
| 2. Apply design | Liquid Metal components + theme tokens | `orca-fe-liquid` |
| 3. Review | Automated quality check | `review-orca-sub-app` |

---

## 📋 Feature Playbooks

Pick the capability you want to add. Each playbook lists the skills to invoke and what the marketer/customer sees.

---

### Playbook: HR Platform Integrations

**One-liner:** *"Connect any HR platform — employee data flows into Orca automatically."*

| Supported Platform | Skill | What it does |
|-------------------|-------|-------------|
| BambooHR | `backend-service-integration/bamboohr` | Sync employee directory |
| Deel | `backend-service-integration/deel` | Sync contractor & employee data |
| Gusto | `backend-service-integration/gusto` | OAuth2 payroll data sync |
| HiBob | `backend-service-integration/hibob` | Sync employee profiles |
| Personio | `backend-service-integration/personio` | Sync HR records |
| Rippling | `backend-service-integration/rippling` | Sync workforce data |
| Workday | `backend-service-integration/workday` | Enterprise HCM integration |

**Demo story:** "Orca connects to your existing HR system in minutes — no manual data entry. Employee records, org charts, and compliance data flow in automatically."

**How to invoke:** *"Add [BambooHR/Deel/etc.] integration to my app"*

---

### Playbook: Approval Workflows & E-Signatures

**One-liner:** *"Route any document for multi-step approval, then send for e-signature — all inside Orca."*

| Capability | Skill | What it does |
|-----------|-------|-------------|
| Multi-phase approvals | `backend-service-integration/approval` + `orca-fe-components/approval-flow` | Configurable approval chains with conditional rules |
| E-signatures | `backend-service-integration/digital-sign` + `orca-fe-components/digital-sign` | Send docs via Dropbox Sign or Adobe Sign |
| Document upload | `orca-fe-components/document-upload` | Upload files to cloud storage via signed URLs |

**Demo story:** "An employee submits a policy exception → their manager approves → Legal reviews → the document is sent for e-signature. Entire flow happens inside Orca — no DocuSign tab-switching."

**How to invoke:** *"Add an approval workflow with e-signatures to my app"*

---

### Playbook: AI-Powered Assistants

**One-liner:** *"Build AI agents that answer compliance questions, draft policies, and research regulations."*

| Capability | Skill | What it does |
|-----------|-------|-------------|
| AI agent runtime | `backend-service-integration/app` | Run single/multi-turn agent conversations with streaming |
| Custom RAG agents | `backend-service-integration/ragagent` | Configure agents with domain-specific knowledge bases |
| UI rendering | `backend-service-integration/renderconfig` | Control how AI responses appear in the UI |
| MCP protocol | `backend-service-integration/mcp` | Expose tools to external AI clients |
| Knowledge base | `backend-service-integration/vertexai` | Vector-search over regulations and policies |

**Demo story:** "Ask Orca's AI: 'What are the overtime rules in California for remote workers?' — it cites specific statutes, cross-references your company policy, and drafts a compliant memo."

**How to invoke:** *"Add an AI assistant that can answer [domain] questions"*

---

### Playbook: Compliance & Legal Research

**One-liner:** *"Automate labor law research, policy generation, and compliance tracking."*

| Capability | Skill | What it does |
|-----------|-------|-------------|
| Regulation database | `backend-service-integration/regulation` | Canonical labor law corpus with AI ingestion |
| Codified law | `backend-service-integration/structuredlaw` | Machine-readable statutes with citations |
| Jurisdiction mapping | `backend-service-integration/jurisdiction` | Federal / State / City law catalog |
| Policy generation | `backend-service-integration/policy` | AI-assisted policy drafting + versioning + PDF export |
| Governance docs | `backend-service-integration/governance` | Auto-generate risk assessments & compliance narratives |

**Demo story:** "Orca monitors regulatory changes across 50 states, flags what affects your workforce, and drafts updated policies — replacing weeks of paralegal work."

**How to invoke:** *"Add compliance research and policy generation to my app"*

---

### Playbook: Notifications & Automation

**One-liner:** *"Alert people on Slack and trigger automated email workflows."*

| Capability | Skill | What it does |
|-----------|-------|-------------|
| Slack notifications | `backend-service-integration/notification` | OAuth2 Slack integration + message delivery |
| Email workflows | `backend-service-integration/workflow` | Transactional email via Mailgun |

**Demo story:** "When a compliance deadline approaches, Orca sends a Slack DM to the responsible manager and an email summary to the HR team."

**How to invoke:** *"Add Slack notifications and email alerts to my app"*

---

### Playbook: File & Document Management

**One-liner:** *"Upload, store, organize, and sign documents — all workspace-scoped and secure."*

| Capability | Skill | What it does |
|-----------|-------|-------------|
| File storage | `backend-service-integration/files` | GCS-backed storage with signed URL uploads |
| Upload UI | `orca-fe-components/document-upload` | Drag-and-drop upload button component |
| E-signatures | `backend-service-integration/digital-sign` | Send documents for signature |

**How to invoke:** *"Add file upload and document signing to my app"*

---

### Playbook: Workforce Planning

**One-liner:** *"Manage headcount, org charts, requisitions, and compensation across currencies."*

| Capability | Skill | What it does |
|-----------|-------|-------------|
| Headcount engine | `backend-service-integration/headcount` | Employee records, org trees, requisitions, FX rates, CSV import |

**Demo story:** "See your entire global workforce in one dashboard — headcount by country, compensation in local currency, open requisitions, and hiring pipeline."

**How to invoke:** *"Add workforce planning to my app"*

---

## 📚 Reference: All Skills at a Glance

### App Lifecycle (building & deploying apps)
| Skill | What it does |
|-------|-------------|
| `guide-react-app` | Interactive wizard — answer questions, get an app |
| `create-orca-sub-app` | Full end-to-end app creation orchestrator |
| `scaffold-orca-sub-app` | Generate feature source files from a description |
| `build-orca-sub-app` | Build, test, review, and zip the app |
| `register-orca-sub-app` | Generate registry fields for host integration |
| `review-orca-sub-app` | 7-category automated code review |
| `add-pre-zip-check` | Add a post-build quality gate script |

### Frontend Design & Components
| Skill | What it does |
|-------|-------------|
| `orca-fe-liquid` | Liquid Metal design system (glass, ambient, theme presets) |
| `orca-fe-components/approval-flow` | Approval workflow UI component |
| `orca-fe-components/digital-sign` | E-signature panel component |
| `orca-fe-components/document-upload` | File upload button component |

### Backend Platform
| Skill | What it does |
|-------|-------------|
| `backend-service-integration` | Master index of all 36+ backend services |
| `backend-service-integration/auth` | Current user identity & JWT inspection |
| `backend-service-integration/access` | User accounts, roles, MFA, sessions |
| `backend-service-integration/admin` | System config, cache invalidation, log levels |
| `backend-service-integration/db` | Firestore document CRUD with tenant isolation |
| `backend-service-integration/health` | Kubernetes health probes |
| `backend-service-integration/frontend` | CDN SPA serving with CSP nonce |
| `backend-service-integration/jobs` | Background job tracking (River queue) |

### Data & Objects
| Skill | What it does |
|-------|-------------|
| `backend-service-integration/datamodel` | Data architecture guide (scopes, objects, ReBAC) |
| `backend-service-integration/objects` | Generic object/type/record CRUD |

### AI & Agents
| Skill | What it does |
|-------|-------------|
| `backend-service-integration/app` | AI agent runtime with SSE streaming |
| `backend-service-integration/ragagent` | Custom RAG agent configuration |
| `backend-service-integration/renderconfig` | AI output rendering rules |
| `backend-service-integration/mcp` | Model Context Protocol endpoint |
| `backend-service-integration/vertexai` | Vertex AI knowledge base sync |

### Workflow & Feature Management
| Skill | What it does |
|-------|-------------|
| `backend-service-integration/approval` | Multi-phase approval engine |
| `backend-service-integration/workflow` | Email dispatch & automation triggers |
| `backend-service-integration/policy` | AI policy generation & versioning |
| `backend-service-integration/featureflags` | Feature toggles & capability flags |
| `backend-service-integration/featureprogress` | Onboarding checklists & adoption tracking |

### HRIS Integrations
| Skill | What it does |
|-------|-------------|
| `backend-service-integration/bamboohr` | BambooHR employee sync |
| `backend-service-integration/deel` | Deel contractor/employee sync |
| `backend-service-integration/gusto` | Gusto payroll sync |
| `backend-service-integration/hibob` | HiBob employee sync |
| `backend-service-integration/personio` | Personio HR records sync |
| `backend-service-integration/rippling` | Rippling workforce sync |
| `backend-service-integration/workday` | Workday HCM integration |

### Legal & Compliance
| Skill | What it does |
|-------|-------------|
| `backend-service-integration/regulation` | Labor regulation database + AI ingestion |
| `backend-service-integration/structuredlaw` | Codified legal rules with citations |
| `backend-service-integration/jurisdiction` | US jurisdiction catalog (Fed/State/City) |
| `backend-service-integration/governance` | AI governance document generation |

### Other Services
| Skill | What it does |
|-------|-------------|
| `backend-service-integration/appregistry` | Sub-app registry & deployment pipelines |
| `backend-service-integration/audit` | Audit trail logging |
| `backend-service-integration/notification` | Slack OAuth + notifications |
| `backend-service-integration/proxy` | External HTTP proxy for RSS/legal feeds |
| `backend-service-integration/digital-sign` | E-signature backend (Dropbox Sign / Adobe Sign) |
| `backend-service-integration/headcount` | Workforce planning engine |

---

## 🎯 Cheat Sheet: "I want to build ___"

| I want to build... | Start with |
|---|---|
| A brand new Orca app | Tutorial 1 above |
| An HR dashboard | HR Platform Integrations playbook |
| A compliance research tool | Compliance & Legal Research playbook |
| An AI-powered assistant | AI-Powered Assistants playbook |
| A document approval flow | Approval Workflows & E-Signatures playbook |
| A workforce planning tool | Workforce Planning playbook |
| A notification/alert system | Notifications & Automation playbook |
