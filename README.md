# AMR Watch — Antimicrobial Resistance Monitoring Dashboard

Built for the **ASM–IIT Delhi World Microbiome Day Hackathon**. A production-shaped
public health surveillance platform for tracking antibiotic usage and AMR risk
across Delhi/NCR hospitals.

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL. No environment variables or credentials are
required — the app runs entirely on a realistic mock dataset (12 Delhi/NCR
hospitals, 48 patient records) persisted to `localStorage`, so every create /
edit / delete action is real and survives a page reload.

## Demo accounts (pre-filled on the login screen)

| Role             | Email                     | Password        | Access                                  |
|------------------|---------------------------|-----------------|------------------------------------------|
| Administrator    | admin@amrwatch.in         | Admin@123       | Full access to every module              |
| Hospital         | hospital@amrwatch.in      | Hospital@123    | Manage only that hospital's patients     |
| Health Authority | authority@amrwatch.in     | Authority@123   | Read-only analytics, no CRUD             |

## What's inside

- **Dashboard** — network stats, AMR trend chart, district risk heatmap, high-risk list, active alerts
- **Hospital Management** — searchable/filterable/paginated table with full CRUD
- **Patient Records** — full CRUD, symptom tagging, hospital-scoped for the Hospital role
- **Smart Search** — instant search across name / patient number / hospital / district
- **Patient Report** — full clinical report per patient with one-click PDF export
- **Hospital Report** — AMR history, antibiotic usage trends, AI recommendations, PDF export
- **Interactive City Map** — SVG map of Delhi/NCR with risk-colored markers
- **AI Assistant** — risk explanations, recommendations, stewardship & trend insights, all derived transparently from live dashboard data (see `src/services/aiService.ts` to wire up live OpenAI)
- **Alerts** — auto-detected excessive broad-spectrum use, declining AMR score, high-risk facilities, missing lab confirmation
- **Reports** — generate Daily/Weekly/Monthly/Annual reports, export PDF/CSV/Excel
- **Settings** — profile, theme/dark mode, notifications, API keys

## Architecture

- React 19 + TypeScript + Vite, Tailwind CSS v4 (CSS-first theme in `src/index.css`)
- Client-side "Firestore-shaped" data layer (`src/services/dataService.ts`) — see
  `src/services/README.md` for exactly how to swap in real Firebase/OpenAI
- Recharts for data viz, Framer Motion for the login sequence, Lucide for icons
- Role-based access control enforced both in navigation (`Sidebar.tsx`) and routing (`ProtectedRoute.tsx`)
- Toasts, loading skeletons, empty states, and a top-level error boundary throughout

## Design system

A dark "culture & clinic" theme: deep navy-black base, a signature teal
**Resistance Pulse** ring (an animated culture-growth gauge used for every AMR
score in the app), with amber/crimson reserved strictly for moderate/high risk
semantics — never as decoration. Space Grotesk for display type, Inter for
body copy, IBM Plex Mono for patient IDs and data readouts.
