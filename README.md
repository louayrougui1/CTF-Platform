# 🚩 FlagLab — CTF Platform

FlagLab is a full-stack Capture The Flag (CTF) platform where users can create and manage events, join competitions, form teams, solve cybersecurity challenges, and compete on event-specific leaderboards.

## Features

* **CTF Events:** Create and manage public or private events.
* **Teams:** Join events, create teams, and collaborate with other players.
* **Challenges:** Create and solve challenges across multiple cybersecurity categories, with configurable difficulty and points.
* **File Sharing:** Upload and download challenge attachments.
* **Leaderboards:** Track team scores and rankings for each event.
* **Authentication:** Email registration and verification, password reset, and Google OAuth sign-in.
* **Security:** Password hashing, JWT-based authentication, and API rate limiting.

## Tech Stack

### Frontend

* React 19 + TypeScript
* TanStack Start and TanStack Router
* Vite
* Tailwind CSS and shadcn/ui
* TanStack Query and Zustand
* Axios

### Backend

* NestJS
* Prisma ORM and PostgreSQL
* Passport.js (Local, JWT, Google OAuth 2.0)
* bcrypt
* Email OTP verification and password reset
* NestJS Throttler
* Swagger / OpenAPI

### Infrastructure

* **Supabase:** PostgreSQL database and file storage
* **Render:** Backend API hosting
* **Vercel:** Frontend hosting

## Getting Started

### Prerequisites

Make sure you have the following installed or configured:

* Node.js 20 or newer
* npm
* A PostgreSQL database (Supabase is supported)
* Google OAuth credentials for Google sign-in
* Gmail API or the configured email service credentials for email verification and password reset

### Installation

1. Clone the repository and install the dependencies in both the `backend/` and `frontend/` directories.
2. Configure the required environment variables using the provided `.env.example` files.
3. Set up your PostgreSQL database and configure the database connection.
4. Configure Google OAuth and email credentials if you want to use Google sign-in and email-based features.
5. Generate the Prisma Client and apply the database migrations.
6. Start the backend and frontend development servers.

Refer to the environment templates and project-specific documentation for configuration details.

> **Note:** The backend requires its environment variables to be available in the process environment at startup. Ensure the required configuration is set before running the application.

## API Documentation

The backend provides Swagger documentation at `/docs` when the API server is running.

## Repository Structure

```text
backend/     NestJS API and database configuration
frontend/    React application
```

## Deployment

* **Frontend:** Vercel
* **Backend:** Render
* **Database and file storage:** Supabase

The backend's free hosting tier may experience cold starts after periods of inactivity.

## Links

* **Live Demo:** [FlagLab](https://flaglab-nine.vercel.app/)
* **Source Code:** [GitHub Repository](https://github.com/louayrougui1/FlagLab---CTF-Platform)
* **Author:** [Louay Rougui](https://louayrougui-portfolio.vercel.app/)
