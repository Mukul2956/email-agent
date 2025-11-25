# 🚀 AI-Powered Email Dashboard

A modern, full-stack productivity tool that transforms your email workflow with AI-powered categorization, actionable insights, and automated drafting. Built with Node.js, Express, PostgreSQL (Supabase), Prisma ORM, React, and Vite.

---

## ✨ Features
- **Inbox Zero, Reimagined:** Smart categorization of emails (Work, Personal, Shopping, Social, Finance, etc.)
- **AI Action Items:** Extract actionable tasks from emails using custom prompts
- **Automated Drafts:** Generate professional reply drafts with AI
- **Frontend Dashboard:** Beautiful, responsive UI with real-time updates
- **Database Integration:** Store, query, and process emails with PostgreSQL
- **Prompt Brain:** Configure and experiment with AI prompts for custom workflows
- **Security First:** API keys and secrets managed via `.env` (never exposed)

---

## 🖥️ Tech Stack
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL (Supabase)
- **Frontend:** React, Vite, Tailwind CSS, Radix UI
- **AI Integration:** OpenRouter API (LLM)
- **Dev Tools:** Docker, Nodemon, Prisma Studio

---

## ⚡ Quick Start

### 1. Clone & Install
```bash
# Clone the repo
git clone https://github.com/Mukul2956/email-agent.git
cd email-agent

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup
See [`DATABASE_SETUP.md`](DATABASE_SETUP.md) for full instructions.
- Use local PostgreSQL or Docker
- Run migrations with Prisma
- Seed with mock data if desired

### 3. Environment Variables
- Copy `.env.example` to `.env` in `backend/`
- Add your OpenRouter API key and database credentials
- **Never commit real API keys to GitHub!**

### 4. Run the App
```bash
# Start backend
cd backend
npm start

# Start frontend
cd ../frontend
npm run dev
```

---

## 🧠 How It Works
- **Inbox:** Load emails from database, filter, search, and process with AI
- **AI Process:** Categorize emails and extract action items using LLM prompts
- **Drafts:** Generate reply drafts with a single click
- **Prompt Brain:** Edit and reset AI prompts for custom results
- **Health Check:** Backend available at `/api/health`

---

## 🔒 Security & Best Practices
- Secrets/API keys are stored in `.env` (excluded from repo)
- Example env files use placeholders only
- Rotate your API keys if exposed
- Use HTTPS and CORS for production

---

## 📚 Documentation
- [`DATABASE_SETUP.md`](DATABASE_SETUP.md): Full database setup guide
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma): Data models
- Frontend code: [`frontend/src/`](frontend/src/)
- Backend code: [`backend/`](backend/)

---

## 🛠️ Troubleshooting
- See [`DATABASE_SETUP.md`](DATABASE_SETUP.md) for common issues
- Use Prisma Studio to inspect your database
- Check backend logs for API errors

---

## 🤝 Contributing
Pull requests and issues welcome! Please follow best practices and do not commit secrets.

---

## 📝 License
MIT

