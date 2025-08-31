# Personal Credit & Cashflow Control Platform

A local-first personal finance platform for credit optimization, statement parsing, and payment planning using AZEO (All Zero Except One) strategy.

## Features

- **Local-First Architecture**: All data stored locally in SQLite by default
- **GPT-5 Statement Parsing**: Automatically extract data from PDF statements
- **AZEO Credit Optimization**: Maximize credit score improvement while minimizing interest
- **Encrypted Credential Storage**: Secure vault for API keys and login credentials
- **Automated Data Fetching**: Browser automation to fetch live account data
- **Payment Planning**: Generate optimal monthly payment allocations

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- OpenAI API key (for statement parsing)

### Installation

1. Clone and install dependencies:
```bash
git clone <repository-url>
cd personal-credit-control
pnpm install
```

2. **Set up environment variables**
   Create a `.env.local` file with:
   ```env
   # BigQuery Configuration
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_DATASET=your-dataset-name
   GOOGLE_APPLICATION_CREDENTIALS=./path-to-service-account-key.json
   GOOGLE_CLOUD_LOCATION=US
   
   # OpenAI API Key for GPT-5 statement parsing
   OPENAI_API_KEY=your_openai_api_key_here
   
   # App Security
   VAULT_PASSCODE=your_secure_passcode
   
   # Server Configuration
   PORT=7777
   NEXT_PUBLIC_API_URL=http://localhost:7777
   ```

3. Initialize database:
```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

4. Start development server:
```bash
pnpm dev
```

5. Open http://localhost:3000

## Usage Guide

### 1. Initial Setup

1. **Settings**: Navigate to Settings and unlock the vault with a secure passcode
2. **API Keys**: Add your OpenAI API key for statement parsing
3. **Accounts**: The seed script creates sample accounts to get started

### 2. Import Statements

1. Go to **Import** page
2. Upload PDF statements from your credit cards/banks
3. Review parsed data and approve ingestion
4. Data is automatically linked to accounts

### 3. Generate Payment Plan

1. Visit **Pay This Month** page
2. Set your monthly budget using the slider
3. Click "Generate Plan" to see optimized allocations
4. Review payment recommendations and rationale
5. Export plan as CSV/JSON or mark payments as executed

### 4. Monitor Dashboard

- View overall credit utilization and health metrics
- See upcoming payment dates and alerts
- Monitor account-level utilization heatmap

### 5. Fetch Live Data (Optional)

1. Go to **Fetch Data** page
2. Configure credentials for supported issuers
3. Run fetch tasks to get live balances and due dates
4. Data automatically updates your accounts

## Architecture

### Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (local) or PostgreSQL (optional)
- **UI**: shadcn/ui components, Recharts for visualization
- **Security**: libsodium for encryption, secure credential vault
- **Parsing**: OpenAI GPT-4 with structured outputs
- **Automation**: Playwright for browser automation

### Key Components

- **Allocation Engine** (`lib/allocation-engine.ts`): AZEO optimization logic
- **Statement Parser** (`parsers/`): GPT-5 integration for PDF parsing
- **Crypto Vault** (`lib/crypto-vault.ts`): Encrypted credential storage
- **Dashboard** (`components/dashboard/`): Real-time financial overview

## AZEO Strategy

The platform implements the "All Zero Except One" credit optimization strategy:

1. **Pay minimums** on all accounts first
2. **Fix over-limit** accounts immediately
3. **Choose reporter card** (highest limit, mainstream issuer)
4. **Drive non-reporters to $0** balance
5. **Optimize reporter** to $20-$40 balance
6. **Avalanche remaining budget** by highest APR

This maximizes credit score improvement by minimizing reporting accounts while maintaining optimal utilization ratios.

## Security & Privacy

- **Local-First**: All data stored locally by default
- **Encrypted Storage**: Sensitive data encrypted with your passcode
- **No External Dependencies**: Works completely offline except for OpenAI parsing
- **Audit Trail**: All access and modifications logged
- **Secure Automation**: Browser sessions run locally with manual 2FA approval

## Supported Issuers

### Fully Supported
- Chase (balance, due dates, transactions)
- Capital One (balance, available credit)
- Synchrony Bank (balance, promotions)
- Credit One (basic balance and due dates)

### Planned Support
- Discover, American Express, Citi
- Bank accounts and loan providers

## Development

### Database Changes

```bash
# Create migration
pnpm prisma migrate dev --name description

# Reset database
pnpm prisma migrate reset

# View data
pnpm prisma studio
```

### Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e
```

### Adding New Issuers

1. Add issuer to `IssuerKind` enum in schema
2. Create selector configuration in `lib/issuers/selectors/`
3. Implement fetch flow in `playwright-mcp/flows/`
4. Add to supported issuers list

## Deployment

### Local Production

```bash
pnpm build
pnpm start
```

### Docker

```bash
docker build -t credit-control .
docker run -p 3000:3000 -v ./data:/app/data credit-control
```# MyMoney
