backend/
├── primary-backend/                       # Primary backend service (Express.js API + Redis publisher)
│   ├── src/
│   │   ├── config/                        # Configurations for Redis, DB, etc.
│   │   ├── controllers/                   # API logic (log collection, fetching analysis)
│   │   ├── services/                      # Core business logic (log processing, polling)
│   │   ├── routes/                        # Routes for log management, analysis fetching
│   │   ├── app.ts                         # Main entry for Express.js server
│   ├── dist/                              # Compiled JS files
│   └── package.json                       # Dependencies, metadata, and scripts
└── log-processor/                         # Worker 2 service (Log queue processor + LLM interaction)
    ├── src/
    │   ├── config/                        # Redis, LLM API configurations
    │   ├── services/                      # Core business logic (queue consumption, sending logs to LLM)
    │   ├── workers/                       # Worker to listen to the Redis queue
    │   ├── app.ts                         # Main entry for Worker 2
    ├── dist/                              # Compiled JS files for worker
    └── package.json                       # Worker dependencies, metadata, and scripts
