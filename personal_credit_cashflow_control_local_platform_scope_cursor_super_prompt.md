# Personal Credit & Cashflow Control — Local Platform Scope + Cursor Super Prompt

This document gives you (Cursor) a full **scope** and an actionable **build prompt** to scaffold and implement a **local‑first** personal finance platform that manages **bank accounts, credit cards, loans, statements, and payoff plans** with a focus on **credit‑score optimization (AZEO)** and **interest minimization**.

---

## 1) Goals & Guardrails

**Primary outcomes**
- Single‑pane control of your finances (balances, due dates, APRs, promos, score levers).
- File‑based **statement import** (PDF → structured records) using **GPT‑5 structured output**.
- **PayThisMonth** engine: allocate a monthly budget to maximize **score lift** while minimizing interest.
- **FetchData** automation via **Playwright MCP** to log in and scrape balances/close dates when statements aren’t available.

**Non‑functional**
- **Local‑first**: default to local storage; optional remote DB later.
- **Security**: all secrets encrypted at rest; least‑privilege; robust audit trail.
- **No mock/placeholder data**. If data missing → show clear empty‑state + ask user to upload or fetch.
- **Idempotent** jobs and parsers. Re‑ingestion shouldn’t duplicate.

**Compliance & ethics**
- Respect website terms when scraping. Provide toggles per institution; user‑initiated only.
- Personally identifying information (PII) stored locally and encrypted.

---

## 2) Tech Stack (local‑first)

- **App**: Next.js 14 (App Router) + React 18 + TypeScript
- **UI**: Tailwind CSS + shadcn/ui + lucide-react icons
- **State/Async**: Zustand (light local state), TanStack Query (server cache)
- **API**: Next.js Route Handlers (REST-ish) with **Zod** validation
- **DB**: Prisma ORM with **SQLite** (local). Toggleable to Postgres via `DATABASE_URL`.
- **Jobs/Scheduling**: `node-cron` (local), queueable tasks with `bullmq` optional
- **Scraping**: **Playwright** with **MCP** agent wrapper (separate package)
- **PDF & LLM parsing**: `pdf-parse` for fallback, primary JSON extraction via **GPT‑5** structured outputs
- **Crypto**: `tweetnacl`/`libsodium-wrappers` for vault encryption
- **Auth**: Local passcode for unlock; optional OS keychain bindings
- **Charts**: Recharts
- **Testing**: Vitest + Playwright tests

---

## 3) Repository Layout

```
/ (monorepo or single app ok)
  /app
    /(dashboard)
    /(import)
    /(pay-this-month)
    /(fetch-data)
    /(accounts)
    /(settings)
    /api
      /accounts
      /statements
      /transactions
      /plans
      /fetch
      /parsers
  /components
  /lib
    db.ts
    crypto-vault.ts
    score-utils.ts
    allocation-engine.ts
    issuers
      /normalizers
      /selectors
  /parsers
    gpt5-schema.ts
    statement-router.ts
  /playwright-mcp
    index.ts
    tasks/
    flows/
  /prisma
    schema.prisma
  /scripts
    seed.ts
    migrate.ts
  /tests
```

---

## 4) Data Model (Prisma)

```prisma
// prisma/schema.prisma

enum AccountType { BANK CARD LOAN OTHER }
enum IssuerKind { SYNCHRONY CAPITALONE CHASE CREDITONE MISSIONLANE APPLE FIRSTINTERSTATE BESTEGG UPSTART OTHER }

datasource db { provider = "sqlite" url = env("DATABASE_URL") }

generator client { provider = "prisma-client-js" }

model Institution {
  id        String   @id @default(cuid())
  name      String
  kind      IssuerKind
  website   String?
  accounts  Account[]
  createdAt DateTime @default(now())
}

model Account {
  id            String      @id @default(cuid())
  institutionId String
  institution   Institution @relation(fields: [institutionId], references: [id])
  type          AccountType
  displayName   String
  last4         String?
  currency      String @default("USD")
  openedAt      DateTime?
  closedAt      DateTime?
  // For cards
  creditLimit   Int?
  // For loans
  originalPrincipal Int?
  termMonths    Int?
  secured       Boolean?
  aprs          AprHistory[]
  limits        LimitHistory[]
  statements    Statement[]
  transactions  Transaction[]
  autopays      Autopay[]
  promotions    Promotion[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model AprHistory {
  id        String   @id @default(cuid())
  accountId String
  account   Account  @relation(fields: [accountId], references: [id])
  aprType   String   // purchase/cash/loan
  aprPct    Decimal  @db.Decimal(5,2)
  effective DateTime @default(now())
}

model LimitHistory {
  id        String   @id @default(cuid())
  accountId String
  account   Account  @relation(fields: [accountId], references: [id])
  limit     Int
  effective DateTime @default(now())
}

model Statement {
  id          String   @id @default(cuid())
  accountId   String
  account     Account  @relation(fields: [accountId], references: [id])
  periodStart DateTime
  periodEnd   DateTime
  closeDate   DateTime
  dueDate     DateTime?
  newBalance  Decimal  @db.Decimal(12,2)
  minPayment  Decimal  @db.Decimal(12,2)
  pdfPath     String?
  parsedBy    String? // gpt5/pdf
  createdAt   DateTime @default(now())
}

model Transaction {
  id          String   @id @default(cuid())
  accountId   String
  account     Account  @relation(fields: [accountId], references: [id])
  postedAt    DateTime
  description String
  amount      Decimal  @db.Decimal(12,2) // +credit, -debit
  category    String?
  source      String? // statement|scrape|manual
  metadata    Json?
}

model Autopay {
  id            String   @id @default(cuid())
  accountId     String
  account       Account  @relation(fields: [accountId], references: [id])
  kind          String   // min|statement|fixed
  amount        Decimal? @db.Decimal(12,2)
  dayOfMonth    Int?
  enabled       Boolean  @default(true)
}

model Promotion {
  id            String   @id @default(cuid())
  accountId     String
  account       Account  @relation(fields: [accountId], references: [id])
  promoType     String   // deferredInterest|0apr|equalPayment
  startDate     DateTime
  endDate       DateTime
  notes         String?
}

model ScoreSnapshot {
  id            String   @id @default(cuid())
  date          DateTime @default(now())
  bureau        String   // EXP|TU|EQF|unknown
  score         Int
  model         String?  // FICO8, Vantage 4, etc.
}

model Plan {
  id            String   @id @default(cuid())
  month         Int
  year          Int
  budget        Decimal  @db.Decimal(12,2)
  strategy      String   // AZEO+Avalanche
  createdAt     DateTime @default(now())
  allocations   Allocation[]
}

model Allocation {
  id          String   @id @default(cuid())
  planId      String
  plan        Plan     @relation(fields: [planId], references: [id])
  accountId   String
  amount      Decimal  @db.Decimal(12,2)
  rationale   String
  dueBy       DateTime?
  willReport0 Boolean  @default(false)
}
```

---

## 5) Page Specs

### Dashboard
**Purpose**: One‑glance state of credit health.
- KPIs: Total balances, total limits, overall utilization, #cards reporting, next due dates, next close dates, promo expirations.
- Widgets: Utilization donut, Cards heatmap by % utilization, Loans payoff timeline, Alerts (over‑limit, late risk, promo expiring), Upcoming payments calendar.

### Import Statements
**Flow**: Drag‑drop PDFs → GPT‑5 parse → map to account → approve.
- Show side‑by‑side: PDF preview + extracted JSON.
- Diff/merge on re‑upload (idempotent ingestion) and safe re‑parse.
- Validations: statement period continuity; balance math (prev + activity = new).

### PayThisMonth
**Input**: Monthly budget amount.
**Output**: Allocation plan to maximize score & minimize interest.
- **Objectives** (priority order):
  1) Cure over‑limits.
  2) AZEO: minimize #cards reporting; target all $0 except one small reporter.
  3) Bring high‑util cards below 90%→70%→50%→30% thresholds.
  4) Avalanche by APR with due/close‑date timing to ensure changes **report** this cycle.
- **UI**: Slider for budget, table of suggested payments per account, badges ("reports $0", "below 30%", "promo protected"), and a calendar with target **pay‑by** dates (>=3–5 days pre‑close).
- **Exports**: CSV/JSON of plan; “mark executed” to log real payments.

### FetchData (Playwright MCP)
- Vaulted credentials per institution (encrypted).
- Headful login flows with 2FA prompts (no storage of OTPs).
- Tasks: fetch current balance, statement close date, due date, min payment, limit, promo banners.
- Selector registry per issuer in YAML (versioned in `/lib/issuers/selectors`).

### Accounts & Details
- Account drill‑down: balances trend, statements list, APR history, promotions, autopay config, transactions.

### Settings
- Vault passcode, DB selection (SQLite/Postgres), OpenAI keys, MCP toggles, and risk disclaimer.

---

## 6) Allocation Engine (AZEO + Avalanche)

**Inputs**: accounts (limits, APRs, balances, due/close dates, promos), monthly budget, today’s date.

**Constraints**
- Always pay minimums.
- Ensure payments post ≥3–5 days pre close date when targeting reporting changes.
- Don’t break promo terms (e.g., equal payments or deferred interest windows).

**Objective function (lexicographic)**
1. Minimize over‑limit flags.
2. Minimize `cards_reporting_count` (prefer 1 reporter with $20–$40 balance).
3. Minimize weighted utilization: `w1*totalUtil + w2*sum(perCardUtil^2)`.
4. Minimize interest: prioritize higher APRs (subject to 2 & 3).

**Heuristic/Pseudocode**
```
1) Reserve sum(min payments) from budget.
2) Fix over-limit: allocate just enough per card to < 100% util.
3) Choose reporter card = highest limit, mainstream issuer.
4) Drive all other cards to $0 if possible; if not, push them under next threshold (90/70/50/30).
5) Ensure reporter ends with $20–$40.
6) With remaining budget, avalanche toward highest APR balances.
7) Annotate each allocation with rationale + expected reporting effect.
```

---

## 7) GPT‑5 Statement Parser (structured output)

**System prompt**
- “You convert bank/credit/loan **PDF statements** into strict JSON according to the provided schema. Never invent values. If a field is missing, return `null` and add `missing[]` notes.”

**Schema (Zod/JSON)**
```ts
StatementSchema = {
  issuer: string, account_last4: string|null, account_type: 'CARD'|'BANK'|'LOAN',
  period_start: string, period_end: string, close_date: string, due_date: string|null,
  credit_limit: number|null, new_balance: number, min_payment: number|null,
  aprs: {type: 'purchase'|'cash'|'loan', apr_pct:number}[],
  promotions: {type:string, start_date:string|null, end_date:string|null, notes:string|null}[],
  transactions: {date:string, description:string, amount:number}[],
  notes: string[], missing: string[]
}
```

**Flow**
- Upload PDF → send to GPT‑5 with schema → validate with Zod → write `Statement`, `AprHistory`, `Promotion`, `Transaction` rows.
- Deduplicate by `(accountId, periodStart, periodEnd)`.

---

## 8) Playwright MCP Integration

- **Tasks**: `login`, `fetchSummary`, `fetchCloseDate`, `fetchDueMin`, `fetchPromos`.
- **Flows**: per‑issuer scripts (e.g., CapitalOne, Synchrony, Chase). Store selectors and URLs in YAML; detect DOM changes.
- **Output**: normalized JSON → upsert Accounts/LimitHistory/AprHistory/Statement placeholders.

---

## 9) API Endpoints (Next.js route handlers)

- `POST /api/statements/ingest` — multipart PDF → JSON → DB
- `POST /api/statements/parse` — accepts file path → returns parsed JSON (debug)
- `GET /api/accounts` — list accounts with live metrics
- `GET /api/plans/suggest?month&year&budget` — run allocation engine
- `POST /api/fetch/:issuer` — trigger MCP task
- `POST /api/payments/mark` — mark an allocation executed

All inputs validated by Zod; all responses typed.

---

## 10) Security & Vault

- `crypto-vault.ts` exposes `encrypt(secret)`, `decrypt(cipher)` using libsodium sealed boxes.
- Credentials stored as `vault://` records tied to an app passcode; optional OS keychain adapter.
- Audit log of access (who/when, local user).

---

## 11) Testing & QA

- **Unit**: parsers, allocation‑engine edge cases (over‑limit, promos, reporter selection).
- **E2E**: Import → Plan → Mark executed → Dashboard reflects.
- **Playwright**: issuer flows with test accounts (or recorded mocks gated behind a flag; never hardcode real PII in repo).

---

## 12) Dev Setup

1. `pnpm i`
2. `cp .env.example .env.local` and set `OPENAI_API_KEY`, `DATABASE_URL="file:./dev.db"`
3. `pnpm prisma migrate dev`
4. `pnpm dev`

---

## 13) Acceptance Criteria

- Can ingest real statements (Apple/CapitalOne/Synchrony/Chase/First Interstate/BestEgg/Upstart) without schema edits.
- Can compute a plan for a given monthly budget that clearly shows: **pay‑by dates**, expected **reporting status**, and **interest rationale**.
- Dashboard surfaces all key risk flags (over‑limit, promo expiry, late‑risk) and utilization ladders.

---

## 14) Cursor Super Prompt (copy‑paste)

**Role**: You are an elite full‑stack engineer team. Build the **local‑first Personal Credit & Cashflow Control** platform as scoped above. Follow the policies below and ship working code.

**Policies**
- **No mock/placeholder data**. Use seed scripts only for structure, not fake financial values.
- **Security first**: vault secrets, never print or log PII; no hard‑coded credentials.
- **Idempotent ingestion** and deterministic planning.
- **Typed APIs** with Zod validation and error handling.

**Tasks**
1. Scaffold Next.js 14 + TS + Tailwind + shadcn/ui + Prisma (SQLite default).
2. Implement Prisma schema (section 4) and migrations; expose a typed DB client.
3. Build pages: **Dashboard, Import, PayThisMonth, FetchData, Accounts, Settings** with clean, modern UI.
4. Implement **GPT‑5 parser**: route handler to accept PDFs, call OpenAI with the provided schema, Zod‑validate, and persist.
5. Implement **allocation‑engine** per section 6; expose `GET /api/plans/suggest?budget&month&year`.
6. Implement **Playwright MCP** package with issuer flows; create `/api/fetch/:issuer` to trigger tasks and persist normalized results.
7. Add charts (Recharts) and alert widgets, plus calendar view for pay‑by dates.
8. Add **crypto vault** for credentials; Settings page to store/retrieve under passcode lock.
9. Tests: Vitest unit tests for engine + parsers; Playwright smoke test for main flows.

**UI/UX checklist**
- Use shadcn Cards, Tabs, Tables, Dialogs. Rounded‑2xl, soft shadows, generous padding.
- Dashboard: KPIs up top; heatmap and calendar below; alerts to the right.
- Import: two‑pane (PDF preview | JSON + validation state).
- PayThisMonth: budget slider, allocation table with badges ("reports $0", "under 30%", "promo protected"), calendar of target dates.

**Deliverables**
- Running dev server with the pages wired.
- `README.md` with setup, .env, and usage instructions.
- `scripts/seed.ts` creating a couple of empty institutions/accounts (no sensitive values) and example parser fixtures.

**Definition of Done**
- I can import a real credit‑card PDF → see parsed fields → approve → see it on Dashboard.
- I can enter a monthly budget → see a payment plan with reasons and dates → mark payments executed → Dashboard updates.
- I can start a Fetch task for an issuer (dummy credentials in dev) → normalized update lands in DB.

**Code Quality**
- ESLint + Prettier, strict TS, React Server Components where natural, TanStack Query on client, no `any` types.
- Descriptive commit messages. Minimal but clear comments where business logic lives.

**Start now.**

