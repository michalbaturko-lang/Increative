# FSA - Full Solution Agency

AI-powered agency operating system for Increative.cz

## Vision

FSA transforms Increative from a "Full Service" agency to a "Full Solution" agency by leveraging AI agents to automate and scale marketing and development services.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FSA PLATFORM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DATA SOURCES                                                   │
│  ├── ClickUp (CRM, projects)                                    │
│  ├── Google Analytics + Ads                                     │
│  ├── Meta Ads                                                   │
│  ├── Sklik                                                      │
│  └── Client websites (scraping)                                 │
│                                                                 │
│  AGENT HIERARCHY                                                │
│  ├── Supervisor Agent (orchestration, quality, escalation)      │
│  └── Worker Agents (task execution)                             │
│      ├── Content creation                                       │
│      ├── SEO analysis                                           │
│      ├── Ads management                                         │
│      ├── Web development                                        │
│      └── Client research                                        │
│                                                                 │
│  SHARED LEARNING                                                │
│  ├── Knowledge Base (templates, processes, examples)            │
│  ├── Portfolio (successful projects → reusable solutions)       │
│  └── Feedback loop (human approval → all agents learn)          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: Claude API (Anthropic)
- **Deployment**: Vercel
- **Edge/CDN**: Cloudflare

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Anthropic API key

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in your API keys in .env.local

# Run the development server
npm run dev
```

### Database Setup

1. Create a new Supabase project
2. Run the schema: `supabase/schema.sql`
3. Update `.env.local` with your Supabase credentials

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                 # Base UI components
│   ├── layout/             # Layout components (sidebar, header)
│   └── dashboard/          # Dashboard-specific components
├── lib/
│   ├── agents/             # Agent orchestration logic
│   ├── supabase.ts         # Database client
│   └── utils.ts            # Utility functions
├── types/
│   └── agent.ts            # TypeScript type definitions
└── supabase/
    └── schema.sql          # Database schema
```

## Features (Roadmap)

### Phase 0: Foundation ✅
- [x] Next.js project setup
- [x] UI components
- [x] Database schema
- [x] Agent type definitions
- [x] Dashboard layout

### Phase 1: Client Intelligence
- [ ] ClickUp integration
- [ ] Client import & sync
- [ ] AI-powered opportunity detection
- [ ] Client scoring

### Phase 2: Agent System
- [ ] Supervisor agent logic
- [ ] Worker agent execution
- [ ] Task queue management
- [ ] Real-time progress updates

### Phase 3: Content & Analysis
- [ ] Content creation module
- [ ] SEO audit automation
- [ ] Competitor analysis
- [ ] Report generation

### Phase 4: Integrations
- [ ] Webflow API
- [ ] Google Ads API
- [ ] Meta Ads API
- [ ] Sklik API

### Phase 5: MVP Factory
- [ ] Project templates
- [ ] Landing page generator
- [ ] Portfolio management

## License

Proprietary - Increative.cz
