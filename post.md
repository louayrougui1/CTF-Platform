Hey everyone! 👋

🚩 **FlagLab — Full-Stack CTF Platform**

I built FlagLab, a platform where users can create CTF events, join competitions, form teams, solve cybersecurity challenges, and compete on leaderboards.

**Features:**

- 🏆 Create and manage public or private CTF events
- 👥 Join events and collaborate in teams with role-based permissions
- 🚩 Create and solve challenges across Web, Crypto, Pwn, Reverse Engineering, Forensics, OSINT, and Misc
- 📊 Track scores and compete on per-event leaderboards
- 🔐 Authentication with email OTP verification, password reset, and Google sign-in
- 📁 Upload and download challenge files
- 🛡️ Rate limiting for authentication and flag submissions

🛠️ Technologies I used

Frontend:
• React 19 + TypeScript
• TanStack Start + TanStack Router (file-based routing)
• Vite
• Tailwind CSS + shadcn/ui (Radix UI)
• TanStack Query + Zustand
• Axios, react-hook-form + Zod

Backend:
• NestJS
• Prisma ORM + PostgreSQL
• Passport.js (Local, JWT, Google OAuth 2.0) + bcrypt
• JWT access tokens with httpOnly refresh cookies
• Nodemailer for OTP emails
• NestJS Throttler for rate limiting
• Swagger / OpenAPI

Infrastructure & Deployment (All On Free Tiers):
• Supabase — PostgreSQL database and file storage
• Render — backend API hosting
• Vercel — frontend hosting

🌱 Building this taught me a lot about full-stack development, REST APIs and DTOs, database relationships, authentication flows, file uploads, and deployment.

My goal is to build something practical while sharpening both my software engineering and cybersecurity skills.

🔗 Try FlagLab: [https://flaglab-nine.vercel.app]
💻 Source code: https://github.com/louayrougui1/CTF-Platform

I'd love to hear your feedback and ideas for future features!

#FlagLab #FullStackDevelopment #React #TypeScript #NestJS #Prisma #PostgreSQL #Supabase #Cybersecurity #CTF #TanStack #WebDevelopment #LearningByBuilding
