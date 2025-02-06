# AI-Powered Log Monitoring and Analysis System

## 📌 Project Overview
This project is designed to **monitor and analyze error logs** in an organization's infrastructure using AI-powered insights. The system consists of multiple components that work together to detect and analyze critical log events in real time, enhancing security and operational efficiency.

## 🎯 Aim of the Project
The primary goal of this project is to **automate log monitoring and analysis** while ensuring that the organization's master machine remains **secure and unexposed** to external threats. By leveraging **AI-driven insights**, this system helps in **detecting anomalies**, improving incident response time, and reducing **manual log analysis efforts**.

## 🏗️ Project Architecture
### **🖥️ Primary Backend (Log Collector Service)**
- Runs on the organization's **master machine** to monitor critical locations for **error logs** like:
  - **Syslogs, Auth logs, Error logs, Dpkg logs, API logs**
- Filters and pushes **only error-related logs** to **Redis queue** for processing.
- Ensures that the **master machine remains safe** from exposure over the internet, protecting it from potential attackers.

### **🔧 Log Processing Worker**
- A separate **backend service** that does the heavy lifting.
- **Pulls logs** from the Redis queue and sends them to an **LLM** for AI-driven insights.
- **Stores analyzed logs** and insights in a **PostgreSQL database**.
- Maintains a **WebSocket connection** to the frontend for real-time updates.

### **📊 Frontend (Real-time Log Dashboard)**
- Displays logs and their analysis in an interactive UI.
- Three key sections:
  - **Graph visualization** of log trends over time.
  - **Real-time logs feed** that updates as new logs arrive.
  - **Error analysis section**, where clicking a log fetches its AI-generated analysis in real time.

## 🛠️ Tech Stack

- **Backend**
  - Node.js
  - TypeScript
  - Express
  - Redis
  - PostgreSQL
  - Prisma ORM
  - WebSocket

- **Frontend**
  - React
  - TypeScript
  - Tailwind CSS
  - Recharts
  - shadcn/ui components

## 🏗️ System Architecture
```mermaid
flowchart LR
    subgraph Primary Backend
        A[Log Collector] --> |Push Logs| B(Redis Queue)
    end
    
    subgraph Worker
        B --> |Pull Logs| C(Log Processor)
        C --> |Analyze Logs| D(LLM)
        D --> |Store Analysis| E(PostgreSQL)
    end
    
    subgraph Frontend
        F[User] --> |Fetch Analysis of Logs| G(Log Processor API)
        G --> |Retrieve from DB| E
        C --> |WebSocket Connection | F
    end
```

## 🚀 **Getting Started**
### **Prerequisites**
Make sure you have the following installed:
- **Node.js** (v18+)
- **Docker**
- **Redis** (Standalone or Docker)
- **PostgreSQL** (Standalone or Docker)

### **📂 Clone the Repository**
```bash
git clone https://github.com/ronitsharma03/AI-powered-log-monitoring-and-analysis
cd AI-powered-log-monitoring-and-analysis
```

### **🔧 Setting up the Services**

#### **1️⃣ Using Docker (Recommended)**
```bash
docker run -d -e POSTGRES_PASSWORD=<mysecretpassword> -p 5432:5432 postgres
docker run -d -p 6379:6379 redis
```

#### **2️⃣ Running Services Manually**
If you are running **Redis and PostgreSQL locally**, make sure they are up and running before proceeding.

##### **🔹 Install dependencies**
```bash
cd primary-backend && npm install
cd ../log-processor && npm install
cd ../frontend && npm install
```

##### **🔹 Setup Database (Prisma Migration)**
```bash
cd primary-backend
npx prisma migrate dev --name 
npx prisma generate
```

##### **🔹 Start the services**
```bash
# Start Primary Backend (Log Collector)
cd primary-backend
npm run dev

# Start Log Processor (Worker)
cd ../log-processor
npm run dev

# Start Frontend
cd ../frontend
npm run dev
```

## ⚡ **Key Features**
- **Real-time Log Monitoring**
  - Automatic error detection
  - Live log streaming
  - WebSocket-based updates

- **AI-Powered Analysis**
  - Root cause analysis
  - Actionable recommendations

- **Interactive Dashboard**
  - Time-series visualization
  - Error frequency tracking
  - Detailed error analysis view

---
📌 **Note:** This system is designed specifically for Veritas to enhance its **log monitoring efficiency**, **reduce manual overhead**, and **ensure infrastructure security**. 🚀
