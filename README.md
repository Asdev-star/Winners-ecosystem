# Winners Ecosystem

A comprehensive multi-tenant platform combining community, academy, marketplace, work, and AI intelligence features.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, React Router 7, Zustand
- **Backend**: Express 5, Prisma 7 (PostgreSQL)
- **Authentication**: JWT, 2FA, Biometric (WebAuthn)
- **Real-time**: WebSocket, LiveKit
- **AI**: FastAPI (separate service)
- **Mobile**: Expo PWA
- **Desktop**: Electron

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Start development
npm run dev:all

# Build for production
npm run build

# Start production server
npm run start:prod
```

## Environment Variables

Create `.env` with:
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
STRIPE_SECRET_KEY=sk_...
FIREBASE_VAPID_KEY=...
```

## Project Structure

```
src/                  # React frontend
├── features/         # Feature modules (community, academy, market, work, cloud, intelligence)
├── components/      # Shared UI components
├── hooks/           # Custom React hooks
├── stores/          # Zustand stores
└── lib/             # Utilities and API client

Server/               # Express API
├── routes/          # API endpoints
├── services/        # Business logic
├── middleware/      # Express middleware
└── db.ts            # Prisma client

prisma/
├── schema.prisma    # Database schema
└── migrations/      # DB migrations

mobile/WinnersApp/   # Expo mobile app
electron/            # Electron desktop app
ai-platform/         # FastAPI AI service
sdk/                 # JS/TS SDK
docs/                # Architecture docs
```

## Features

### Community
- Feed, posts, comments, likes
- Groups and directories
- Live spaces and video rooms
- Messaging and chat

### Academy
- Courses and learning paths
- Quizzes and certificates
- Live sessions
- Progress tracking

### Market
- Vendor stores
- Products and categories
- Cart and checkout
- Orders and fulfillment

### Work
- Job listings
- Freelancer profiles
- Contracts and escrow
- Applications

### Cloud
- API keys management
- Connectors and integrations
- Webhooks
- Automations
- AI Agents

### Intelligence
- AI assistants (ARIA, OMEGA)
- Agentic loops
- Credits system
- Analytics and reports

## API Documentation

See `docs/API_REFERENCE.md` for complete API documentation.

## License

Proprietary - All rights reserved