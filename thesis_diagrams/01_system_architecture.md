# Kaarkun — System Architecture Diagram

```mermaid
graph TB
    %% ── Client Layer ──────────────────────────────────────────────────
    subgraph CLIENTS["CLIENT LAYER"]
        direction LR
        MOB["Flutter Mobile App\nAndroid / iOS"]
        WEB["Next.js Web App\nCustomer · Provider"]
        ADM["Next.js Admin Panel"]
    end

    %% ── CI/CD ─────────────────────────────────────────────────────────
    subgraph CICD["CI / CD PIPELINE"]
        direction LR
        GH["GitHub Repository"]
        GA["GitHub Actions Workflow"]
        ECR["AWS ECR\nContainer Registry"]
    end

    %% ── AWS Cloud ─────────────────────────────────────────────────────
    subgraph AWS["AWS CLOUD  (ap-south-1)"]

        ALB["Application Load Balancer\n\n/api/*   →  Backend\n/admin*  →  Admin\n/*       →  Frontend"]

        subgraph ECS["ECS Fargate Cluster"]
            direction TB
            BE["Backend Service\nNode.js 20 · Express 5\nPort 5000"]
            FE["Frontend Service\nNext.js 16\nPort 3000"]
            AS["Admin Service\nNext.js 16\nPort 3000"]
        end

        subgraph DATA["Data Layer"]
            RDS["AWS RDS\nMySQL 8.0\nPrivate Subnet"]
            S3["AWS S3\nacademy-dev-uploads\nAvatars · Images · Documents"]
        end
    end

    %% ── External Services ─────────────────────────────────────────────
    subgraph EXT["EXTERNAL SERVICES"]
        direction TB
        MAIL["Gmail SMTP\nNodemailer\nOTP · Password Reset"]
        GROQ["Groq AI\nChat Support Bot"]
        GEM["Gemini AI\nJob Summarisation"]
        CLA["Claude AI\nDispute Analysis"]
    end

    %% ── Client → ALB ──────────────────────────────────────────────────
    MOB  -- "HTTPS / WebSocket" --> ALB
    WEB  -- "HTTPS / WebSocket" --> ALB
    ADM  -- "HTTPS"             --> ALB

    %% ── ALB → ECS ─────────────────────────────────────────────────────
    ALB -- "Port 5000" --> BE
    ALB -- "Port 3000" --> FE
    ALB -- "Port 3000" --> AS

    %% ── Backend → Data ────────────────────────────────────────────────
    BE -- "mysql2 connection pool" --> RDS
    BE -- "AWS SDK PutObject"      --> S3

    %% ── Backend → External ────────────────────────────────────────────
    BE -- "SMTP"     --> MAIL
    BE -- "REST API" --> GROQ
    BE -- "REST API" --> GEM
    BE -- "REST API" --> CLA

    %% ── CI/CD Flow ────────────────────────────────────────────────────
    GH -- "push to master"       --> GA
    GA -- "docker push"          --> ECR
    ECR -- "force-new-deployment" --> ECS
```

## Component Descriptions

| Component | Technology | Purpose |
|---|---|---|
| Flutter Mobile App | Dart · Flutter 3 | Native Android/iOS app for Customers and Providers |
| Next.js Web App | Next.js 16 · TypeScript | Browser-based interface for Customers and Providers |
| Next.js Admin Panel | Next.js 16 · TypeScript | Internal dashboard for platform administrators |
| Application Load Balancer | AWS ALB | Single entry point; routes traffic by URL path |
| Backend Service | Node.js 20 · Express 5 | REST API + Socket.io WebSocket server |
| Frontend Service | Next.js 16 (SSR) | Serves web app pages |
| Admin Service | Next.js 16 (SSR) | Serves admin panel pages |
| AWS RDS MySQL 8.0 | Amazon RDS | Relational database — users, jobs, bids, bookings |
| AWS S3 | Amazon S3 | Persistent object storage for uploaded files |
| Gmail SMTP | Nodemailer | Sends OTP verification and password-reset emails |
| Groq / Gemini / Claude | Third-party LLM APIs | AI-powered chatbot, job summaries, dispute analysis |
| GitHub Actions | CI/CD Workflow | Builds Docker images, pushes to ECR, redeploys ECS |
