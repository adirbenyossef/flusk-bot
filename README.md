# Agent Platform

A lean, production-ready architecture for building Slack/WhatsApp AI agents with:
- **OpenRouter** for model-agnostic LLM access (200+ models)
- **MongoDB** for conversation history & knowledge base
- **Render** for deployment
- **Vercel AI SDK** for agent orchestration

## Features

- Multi-channel support (Slack, WhatsApp, Web)
- Knowledge base with full-text and semantic search
- Admin dashboard for monitoring and configuration
- Multi-tenant architecture
- Streaming responses
- Tool calling support

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure your environment variables in .env.local

# Run development server
npm run dev
```

## Environment Variables

```bash
# Application
NODE_ENV=development
APP_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb+srv://...

# OpenRouter
OPENROUTER_API_KEY=sk-or-...

# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-... # For Socket Mode (dev only)

# WhatsApp Cloud API
WA_ACCESS_TOKEN=...
WA_VERIFY_TOKEN=your-custom-verify-token
WA_PHONE_NUMBER_ID=...
```

## Project Structure

```
agent-platform/
├── app/                      # Next.js App Router
│   ├── api/
│   │   ├── slack/           # Slack webhook endpoint
│   │   ├── whatsapp/        # WhatsApp webhook endpoint
│   │   ├── chat/            # Web chat API
│   │   └── health/          # Health check endpoint
│   ├── dashboard/           # Admin dashboard
│   └── layout.tsx
├── lib/
│   ├── openrouter.ts        # OpenRouter client
│   ├── agent.ts             # Agent orchestration
│   ├── mongodb.ts           # DB connection
│   ├── knowledge.ts         # Knowledge search
│   └── channels/
│       ├── slack.ts
│       └── whatsapp.ts
├── components/
│   └── ui/                  # UI components
├── db/
│   └── schema.ts            # MongoDB schemas
├── render.yaml              # Render deployment config
├── Dockerfile
└── package.json
```

## Deployment

### Render

1. Push to GitHub
2. Connect repo in Render dashboard
3. Add environment variables
4. Deploy

Or use the render.yaml blueprint for automatic setup.

### Docker

```bash
docker build -t agent-platform .
docker run -p 3000:3000 --env-file .env agent-platform
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/slack` - Slack webhook
- `GET/POST /api/whatsapp` - WhatsApp webhook
- `POST /api/chat` - Web chat API

## Available Models (via OpenRouter)

- Claude Sonnet 4 (balanced)
- GPT-4o (powerful)
- GPT-4o Mini (fast)
- Gemini 2.0 Flash (fast)
- Llama 3.3 70B (cheap)

## Cost Estimates

| Component | Free Tier | Paid Estimate |
|-----------|-----------|---------------|
| Render Web Service | 750 hrs/month | $7/month |
| MongoDB Atlas | 512MB shared | $9/month |
| OpenRouter | $5 free credits | ~$0.002-0.015/1K tokens |

## License

MIT
