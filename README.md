# ProFootball Real-time Match Center Backend

## Overview
A Node.js backend for a real-time football match center. Provides REST APIs, real-time event streaming, chat rooms, and match simulation. Uses Supabase for persistent storage and Redis for in-memory data/pubsub.

## Features
- REST API for match data
- Real-time updates via WebSocket
- Match event streaming endpoint
- Match simulator (3-5 concurrent matches)
- Room-based chat with typing indicators
- Supabase + Redis integration

## Developer Workflows
- Start server: `npm run dev` (dev) or `npm start` (prod)
- Configure `.env` (see `.env.example`)
- Test API: Use Postman/HTTP client for REST, WebSocket client for real-time
- Lint/format: `npm run lint` / `npm run format`

## Architecture
- `src/api/` — REST API routes & server
- `src/realtime/` — WebSocket server & handlers
- `src/simulator/` — Match simulation logic
- `src/services/` — Supabase/Redis integration
- `src/types/` — Shared types/enums

## Conventions
- All API responses: `{ success, data, error }`
- Match status: `NOT_STARTED`, `FIRST_HALF`, `HALF_TIME`, `SECOND_HALF`, `FULL_TIME`
- Event types: `goal`, `yellow_card`, `red_card`, `substitution`, `foul`, `shot`
- Chat: max 300 chars, no empty, 1 msg/sec/user

## Requirements
- Node.js 18+
- Supabase project
- Redis instance

---
See `.github/copilot-instructions.md` for AI agent guidelines.
## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-org/ProFootball.git
cd ProFootball
npm install
```

### 2. Environment Setup

- Copy `.env.example` to `.env` and fill in Supabase and Redis credentials.
- Ensure both Supabase and Redis are running and accessible.

### 3. Running the Server

- **Development:**  
    `npm run dev`
- **Production:**  
    `npm start`
- The match simulator starts automatically with the server. You can configure the number of concurrent matches and simulation speed via environment variables.

### 4. API Usage

#### REST Endpoints

- **Get all matches:**  
    `GET /api/matches`
- **Get match by ID:**  
    `GET /api/matches/:id`
- **Stream match events:**  
    `GET /api/matches/:id/events/stream`  
    (Uses Server-Sent Events for real-time updates)

#### Real-time Features

- **WebSocket connection:**  
    Connect to the WebSocket server (default: `ws://localhost:PORT`) for live match updates and chat.
- **Join a match room:**  
    Subscribe to a match room to receive only relevant updates and chat messages.
- **Chat:**  
    Send messages (max 300 chars, no empty, 1 msg/sec/user). Typing indicators and join/leave notifications are supported.

### 5. Match Simulation

- The simulator generates realistic football events (goals, cards, substitutions, fouls, shots) for 3-5 matches in real time.
- Events are published to Redis and persisted in Supabase.
- All updates are broadcast to subscribed clients via WebSocket and event streams.

### 6. Error Handling

- All API responses follow `{ success, data, error }`.
- 404 returned for missing matches.
- Input validation on all endpoints and chat messages.

### 7. Code Structure

- `src/api/` — Express REST API routes and server setup
- `src/realtime/` — WebSocket server, room management, event/chat handlers
- `src/simulator/` — Match simulation engine and event generation
- `src/services/` — Supabase and Redis integration logic
- `src/types/` — Shared TypeScript types and enums

### 8. Testing & Linting

- **Lint:**  
    `npm run lint`
- **Format:**  
    `npm run format`
- **Build (if using TypeScript):**  
    `npm run build`

### 9. Security & CORS

- CORS is configured for frontend access.
- All user input is validated and sanitized.

---

## FAQ

**Q: How do I add a new event type or match status?**  
A: Update the enums in `src/types/` and ensure all handlers and validators are aware of the new type/status.

**Q: How do I persist new data fields?**  
A: Update Supabase schema and corresponding service logic in `src/services/`.

**Q: How do I scale the simulator or WebSocket server?**  
A: Use Redis pub/sub for horizontal scaling. Adjust simulator concurrency via environment variables.

---

## Contributing

1. Fork the repo and create a feature branch.
2. Follow code conventions and add tests where appropriate.
3. Submit a pull request with a clear description.

---

## License

MIT

---

For more details, see code comments and `.github/copilot-instructions.md`.