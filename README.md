## Repo Narrator

**Speak fluent repository.** Repo Narrator ingests your GitHub repo or zipped codebase, builds structure-aware embeddings, and uses Gemini to generate multi-level explanations, architecture diagrams, and a cockpit-style workbench for exploring complex code.

### Stack

- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: Tailwind CSS 4 (design-tokens + custom bioluminescent theme)
- **UI / UX**: Framer Motion, react-resizable-panels, lucide-react, glassmorphism
- **Visualization**: React Flow, Mermaid, Recharts
- **Code viewer**: Monaco Editor with cyberpunk dark theme
- **State**: React Context + SWR
- **LLM**: Gemini via `@google/generative-ai` (`gemini_adapter`)
- **Auth**: GitHub OAuth via NextAuth (scaffold)
- **Vector DB**: Pluggable `vector_store_adapter` (default in-memory placeholder)

---

## Getting started (local)

1. Install dependencies:

```bash
npm install
```

2. Create an `.env.local` in the project root:

```bash
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash

GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret

DATABASE_URL=your_database_url   # optional placeholder

VECTOR_DB_URL=your_vector_db_url # optional placeholder
VECTOR_DB_KEY=your_vector_db_key # optional placeholder
VECTOR_DB_PROVIDER=pinecone|supabase|weaviate|custom
```

3. Run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000` to see the landing screen (“The Hook”).

---

## Key flows

- **Landing – “The Hook”** (`/`):
  - Command-palette style **Input Hub** for GitHub URL or zip.
  - Animated gradient border and “Analyze” button leading to the loading bay.

- **Neural Loading Bay** (`/loading`):
  - No spinners; instead, a central pulsing core with steps:
    - Cloning → Parsing → Vectorizing → Architecting.
  - Streaming facts (placeholder text for now) to represent indexing telemetry.

- **Cockpit Dashboard** (`/dashboard`):
  - Bento-style layout:
    - Elevator pitch (LLM summary placeholder content).
    - Stack radar (Recharts).
    - Hotspots list with complexity dots.
    - Repo mini-map banner.

- **Deep Dive Explorer** (`/workbench`):
  - `react-resizable-panels` layout:
    - Left: File tree with language + complexity dots.
    - Middle: Monaco editor (read-only).
    - Right: “The Narrator” pane + mini React Flow visualization.

- **Omnipresent Assistant**:
  - Glassmorphic FAB bottom-right, available on all pages.
  - Overlay chat window with placeholder responses wired to local state.
  - Next step: connect to `/api/chat` streaming endpoint (already scaffolded).

---

## Adapters and APIs

- **Gemini LLM adapter**: `src/lib/gemini_adapter.ts`
  - Wraps `@google/generative-ai`, supports streaming via callback.
  - Reads `GEMINI_API_KEY` and optional `GEMINI_MODEL`.

- **LLM abstraction**: `src/lib/llm_adapter.ts`
  - Interface so you can plug in other providers if desired.

- **Vector store adapter**: `src/lib/vector_store_adapter.ts`
  - In-memory no-op default so the UI can run without a real vector DB.
  - Replace with Pinecone/Supabase/Weaviate/self-hosted implementation.

- **Indexing API**: `src/app/api/index-repo/route.ts`
  - Accepts a `RepoIdentifier` (GitHub or zip) and returns a queued job id.
  - Placeholder for your real ingestion / AST / embeddings pipeline.

- **Chat API**: `src/app/api/chat/route.ts`
  - Accepts `question`, optional `repoId` and `context`.
  - Queries the vector store adapter (currently in-memory), then streams Gemini text.

---

## Auth

- NextAuth config is defined in `src/lib/auth.ts` with a GitHub provider.
- Route handler is at `src/app/api/auth/[...nextauth]/route.ts`.
- You must set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env.local`.

Security notes:

- Do **not** log raw GitHub personal access tokens.
- Prefer OAuth with scoped permissions and short-lived tokens.
- If you implement PAT-based flows, store encrypted references, not the token itself.

---

## Testing & CI

- **Unit tests**:
  - Jest + React Testing Library configured via `jest.config.cjs` and `jest.setup.ts`.
  - Example test: `__tests__/landing.test.tsx`.
  - Run with:

  ```bash
  npm test
  ```

- **E2E (placeholder)**:
  - Playwright is installed; add tests under `e2e/` and run:

  ```bash
  npm run test:e2e
  ```

- **CI**:
  - GitHub Actions workflow at `.github/workflows/ci.yml`.
  - On push/PR: installs deps, runs lint and unit tests.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Create a new Vercel project from the repo.
3. Configure the environment variables from the **Getting started** section.
4. Deploy. The default build command is `npm run build`, and output is the standard Next.js app.

Once deployed, you can iterate on:

- Replacing the in-memory vector store with your production vector DB.
  
- Implementing real indexing in `index-repo` and wiring progress into the Neural Loading Bay UI.
