# 🔍 PR Reviewer — AI-Powered GitHub Pull Request Review

An AI-powered web app that reviews GitHub Pull Requests in seconds. Paste a PR link and get a plain-English summary of what changed, a code quality score, and a security scan for hardcoded secrets, all in one clean dashboard.

> **Status:** Working locally · Built as a full-stack learning project

---

##  Live Demo

http://localhost:5173

---

## ✨ Features

- **Paste & review:** Paste any public GitHub PR link and get a review instantly
- **AI summary ("What Changed"):** Plain-English explanation of the PR using an LLM (via Groq)
- **Quality score:** A score out of 100 for the PR
- **Security scan:** Detects hardcoded secrets and common vulnerabilities in the changes
- **PR details:** Title, author, branches, lines added/removed, files changed
- **Export to PDF:** Download the review report
- **Clear error messages:** Friendly errors for invalid links, private repos or missing PRs
- **GitHub token support (optional):** Higher rate limits when a token is provided

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite |
| Backend | Node.js, Express |
| AI | Groq API (LLM inference) |
| Data source | GitHub REST API |

---

## 📁 Project Structure

```
Git-PR-Assist/
├── pr-reviewer-backend/
│   ├── src/
│   │   ├── server.js            # Express server entry point
│   │   └── services/
│   │       └── aiService.js     # AI analysis (Groq model is set here)
│   ├── .env.example             # Sample environment variables
│   └── package.json
├── pr-reviewer-frontend/
│   ├── src/                     # UI components and pages
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)
- A free [Groq API key](https://console.groq.com/keys)
- *(Optional)* A [GitHub Personal Access Token](https://github.com/settings/tokens)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/Git-PR-Assist.git
cd Git-PR-Assist
```

### 2. Set up the backend

```bash
cd pr-reviewer-backend
npm install
```

Create a `.env` file inside `pr-reviewer-backend/` (copy from `.env.example`):

```env
GROQ_API_KEY="your_groq_api_key_here"
GITHUB_TOKEN="your_github_token_here"   # optional
PORT=3001
```

Start the backend:

```bash
npm run dev
```

You should see: `PR Reviewer Backend running on http://localhost:3001`

### 3. Set up the frontend

Open a **new terminal**:

```bash
cd pr-reviewer-frontend
npm install
npm run dev
```

### 4. Open the app

Go to **http://localhost:5173** in your browser.

> Both the backend and frontend must be running at the same time.

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | API key from Groq, used for AI analysis |
| `GITHUB_TOKEN` | ❌ Optional | GitHub token. Raises the rate limit from 60 to 5000 requests/hour |
| `PORT` | ❌ Optional | Backend port (default: `3001`) |

⚠️ **Never commit your `.env` file.** Make sure it is listed in `.gitignore`.

---

## 💡 Usage

1. Open the app at `http://localhost:5173`
2. Paste a **real** public PR link, for example:
   ```
   https://github.com/octocat/Hello-World/pull/6
   ```
3. Press Enter or click the arrow button
4. Wait a few seconds for the review: summary, quality score and security scan
5. Click **Export PDF** to save the report

---

## 🔌 API Reference

### `GET /api/health`
Checks if the backend is running.

```json
{ "status": "ok" }
```

### `POST /api/review`
Reviews a pull request.

**Request body:**
```json
{ "url": "https://github.com/owner/repo/pull/123" }
```

**Response:** PR details, AI summary, quality score and security scan results.

---

## 🧰 Troubleshooting

| Problem | Fix |
|---------|-----|
| `Pull request not found` | Use a real, public PR link. `owner/repo` is only a placeholder |
| `model_not_found` (404) from Groq | The model name in `src/services/aiService.js` is outdated. Check the models available to your key at `https://api.groq.com/openai/v1/models` and update `GROQ_MODEL` |
| `AI analysis failed` | Check that `GROQ_API_KEY` in `.env` is correct and has no extra spaces |
| GitHub rate limit errors | Add a `GITHUB_TOKEN` to `.env` |
| Page does not load | Make sure both the backend (3001) and frontend (5173) are running |
| Changes in `.env` not applied | Stop the backend with `Ctrl + C` and run `npm run dev` again |

---

## 🗺️ Roadmap

- [ ] Support for private repositories (via GitHub token)
- [ ] Line-by-line review comments
- [ ] Review history
- [ ] Choose the AI model from the UI
- [ ] Deploy the app online (Vercel + Render)
- [ ] Dark mode

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👩‍💻 Author

**[SNEHA GOYAL]**

---

⭐ If you found this project helpful, please give it a star!
