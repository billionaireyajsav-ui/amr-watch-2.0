# Services layer

Every service in this folder exposes an **async, Promise-based API** that
mirrors how Firebase Auth / Firestore / the OpenAI API behave. This lets the
whole app run instantly with realistic mock data (no credentials required for
the hackathon demo) while making it a drop-in job to wire up real backends:

| Service            | Mock implementation                          | To go live                                                                 |
|---------------------|-----------------------------------------------|------------------------------------------------------------------------------|
| `authService.ts`     | 3 demo accounts, session in `localStorage`    | Replace body of each function with `firebase/auth` calls (`signInWithEmailAndPassword`, etc). Types are already Firebase-shaped. |
| `dataService.ts`     | In-memory store seeded from `data/mockData.ts`, persisted to `localStorage` | Replace with `firebase/firestore` (`collection`, `getDocs`, `addDoc`, `updateDoc`, `deleteDoc`) against the `hospitals`, `patients`, `alerts`, `reports` collections. |
| `aiService.ts`       | Deterministic templated insights generated from real dashboard data | Replace `generateInsight()` internals with a call to `/v1/chat/completions` (or the Anthropic/OpenAI SDK) using the same prompt-construction helpers already provided. Add `VITE_OPENAI_API_KEY` to `.env` and flip `USE_LIVE_AI` in `aiService.ts`. |
| `pdfService.ts`      | Client-side PDF generation via `jspdf`        | No change needed — works identically against live data. |

No placeholders or TODOs were left in page/component code — every screen is
fully functional against the mock services above.
