# 🚀 AI-Powered Log Monitoring & Analysis System

## 📌 Project Overview
This project is an **AI-powered log monitoring and analysis system** designed for **Veritas** to automate the detection and contextual analysis of error logs. It enhances **system reliability** and **incident response efficiency** by leveraging **machine learning**, **log queueing**, and **real-time WebSocket communication**.

---

## 🎯 Key Features
✅ **Automated Log Collection** – Monitors critical log files for real-time updates.  
✅ **AI-Based Log Analysis** – Uses an LLM (Large Language Model) to analyze logs.  
✅ **Queue-Based Processing** – Logs are sent to a Redis queue for asynchronous handling.  
✅ **PostgreSQL Storage** – Stores logs and their AI-generated insights for retrieval.  
✅ **WebSocket Communication** – Primary backend and worker communicate efficiently over WebSockets.  
✅ **Scalable Architecture** – Easily extendable to monitor additional logs or integrate new AI models.  

---

## 🏗️ Project Architecture
```mermaid
flowchart LR
    subgraph Primary Backend
        A[Log Collector] --> |Push Logs| B(Redis Queue)
    end
    
    subgraph Worker
        B --> |Fetch Logs| C(Log Processor)
        C --> |Analyze Logs| D(LLM)
        D --> |Store Analysis| E(PostgreSQL)
    end
    
    subgraph Frontend
        F[User] --> |Fetch Analyzed Logs| G(Primary Backend API)
        G --> |Retrieve from DB| E
    end
```

---

## ⚙️ Tech Stack
- **Backend**: Node.js, Express.js
- **Worker**: Node.js, Prisma, WebSockets
- **Database**: PostgreSQL
- **Queue**: Redis
- **AI Model**: Large Language Model (LLM)

---

## 📂 Folder Structure
```
backend/
├── primary-backend/                # Primary Backend (Express API, Log Collection, WebSockets)
│   ├── src/
│   │   ├── controllers/            # Handles API logic
│   │   ├── services/               # Business logic for log processing
│   │   ├── routes/                 # API Routes
│   │   ├── app.ts                  # Main entry point
│   ├── dist/                       # Compiled TypeScript
│   └── package.json                # Dependencies & scripts
└── log-processor/                  # Worker (Log queue processing, LLM interaction)
    ├── src/
    │   ├── services/               # Queue consumption, LLM processing
    │   ├── workers/                # Worker logic
    │   ├── app.ts                  # Main entry for worker
    ├── dist/
    └── package.json
```

---

## 🚀 Setup & Installation
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/your-username/log-monitoring-ai.git
cd log-monitoring-ai
```
### 2️⃣ Install Dependencies
```sh
cd backend/primary-backend
npm install

cd ../log-processor
npm install
```
### 3️⃣ Set Up Environment Variables
Create a `.env` file in both **primary-backend** and **log-processor** directories.
```env
# PostgreSQL Database
DATABASE_URL=postgresql://user:password@localhost:5432/logs_db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# WebSocket Configuration
WS_SERVER_URL=ws://localhost:4000
```
### 4️⃣ Start the Services
#### Start Redis (if not running)
```sh
redis-server
```
#### Start Primary Backend
```sh
cd backend/primary-backend
npm run dev
```
#### Start Worker (Log Processor)
```sh
cd backend/log-processor
npm run dev
```

---

## 📊 How It Works
1️⃣ **Logs are collected** from specified system directories.  
2️⃣ **Primary backend pushes logs** to the Redis queue.  
3️⃣ **Worker fetches logs** from Redis, sends them to an **LLM for analysis**.  
4️⃣ **Analyzed logs are stored** in PostgreSQL.  
5️⃣ **Frontend fetches logs** via API/WebSockets for real-time monitoring.  

---

## 🔥 Future Enhancements
- [ ] **Alert System**: Trigger real-time alerts for critical errors.
- [ ] **Dashboard**: Build a UI for visualizing logs and analytics.
- [ ] **Multi-Source Integration**: Monitor logs from cloud services.

---

## 🤝 Contributing
Contributions are welcome! Feel free to open an **issue** or submit a **pull request**. 

---

## 📜 License
This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.

---

## 📞 Contact
For any queries, reach out to **Your Name** at [your-email@example.com](mailto:your-email@example.com).
