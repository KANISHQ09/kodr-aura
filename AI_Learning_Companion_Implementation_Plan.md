# ⚡ 12-Hour Hackathon Build Plan  
## AI Learning Companion — LMS Video Intelligence Assistant  
### Team: 3–4 People | Production-Ready Demo

Based on your updated stack requirements:
- Node.js backend
- Firebase
- Gemini API
- YouTube Transcript package
- React frontend

---

# The Golden Rule

> Build a polished working product that impresses judges in 12 hours — not a perfect enterprise architecture.

Focus on:
- smooth AI responses
- timestamp navigation
- contextual Q&A
- beautiful UI
- fast demo experience

Skip:
- complicated infrastructure
- authentication systems
- microservices
- heavy DevOps

---

# Final Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS |
| Backend | Node.js + Express |
| AI Model | Gemini API |
| Database | Firebase Firestore |
| Storage | Firebase Storage |
| Transcript Extraction | youtube-transcript package |
| Streaming Responses | Server-Sent Events (SSE) |
| Session Memory | Firestore + in-memory cache |
| Deployment | Vercel / Render |

---

# Core Workflow

```text
YouTube Video
       ↓
Extract Transcript
       ↓
Chunk Transcript
       ↓
Store in Firebase
       ↓
Generate Embeddings
       ↓
RAG Context Retrieval
       ↓
Gemini AI Response
       ↓
Timestamp-based Navigation
```

---

# Pre-Hackathon Checklist

Complete before hackathon starts:

- [ ] Firebase project created
- [ ] Gemini API key generated
- [ ] React frontend setup ready
- [ ] Node.js backend initialized
- [ ] Demo YouTube videos selected
- [ ] Transcript extraction tested
- [ ] Vercel deployment connected

---

# Required Packages

## Backend

```bash
npm install express cors dotenv firebase-admin
npm install @google/generative-ai
npm install youtube-transcript
npm install uuid
```

---

## Frontend

```bash
npm install react-router-dom
npm install react-player
npm install axios
npm install lucide-react
```

---

# Team Roles

## 👤 Person A — AI & Backend

Responsibilities:
- transcript extraction
- Gemini integration
- RAG pipeline
- API routes
- session memory

---

## 👤 Person B — Frontend & UI

Responsibilities:
- video player
- AI chat panel
- timestamps
- summaries UI
- responsive layout

---

## 👤 Person C — Firebase & Integration

Responsibilities:
- Firestore setup
- data models
- LMS integration
- API connection
- deployment

---

## 👤 Person D — Demo & Polish

Responsibilities:
- demo preparation
- testing
- animations
- presentation
- bug fixing

---

# Hour-by-Hour Plan

| Time | Task |
|---|---|
| Hour 0–1 | Project setup |
| Hour 1–3 | Transcript extraction + Firebase |
| Hour 3–5 | Gemini Q&A pipeline |
| Hour 5–7 | Timestamp navigation |
| Hour 7–9 | Summaries + session memory |
| Hour 9–11 | UI polish + deployment |
| Hour 11–12 | Demo rehearsal |

---

# Database Structure (Firestore)

## lectures collection

```json
{
  "title": "Introduction to AI",
  "videoUrl": "...",
  "createdAt": "...",
  "duration": 3600
}
```

---

## transcriptChunks collection

```json
{
  "lectureId": "abc123",
  "text": "Neural networks are...",
  "startTime": 120,
  "endTime": 180,
  "embedding": [],
  "topic": "Neural Networks"
}
```

---

# Transcript Extraction

Using:
## youtube-transcript

```js
const { YoutubeTranscript } = require('youtube-transcript');

const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);

console.log(transcript);
```

Output:

```json
[
  {
    "text": "Welcome to machine learning",
    "offset": 1200,
    "duration": 4000
  }
]
```

---

# Chunking Logic

```js
function chunkTranscript(transcript, chunkSize = 8) {
  const chunks = [];

  for (let i = 0; i < transcript.length; i += chunkSize) {
    const slice = transcript.slice(i, i + chunkSize);

    chunks.push({
      text: slice.map(s => s.text).join(" "),
      startTime: slice[0].offset / 1000,
      endTime:
        (slice[slice.length - 1].offset +
          slice[slice.length - 1].duration) / 1000
    });
  }

  return chunks;
}
```

---

# Gemini Integration

```js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});
```

---

# RAG Prompt

```js
const prompt = `
You are an AI Learning Companion.

Answer ONLY using the lecture transcript context below.

If the answer is not found in the transcript:
Say:
"This information was not found in the lecture."

Then provide a general answer separately.

Transcript Context:
${context}

Question:
${userQuestion}
`;
```

---

# Context Retrieval

```js
const relevantChunks = transcriptChunks
  .filter(chunk =>
    chunk.text.toLowerCase().includes(query.toLowerCase())
  )
  .slice(0, 5);
```

---

# Smart Summaries

## Full Lecture Summary

```js
Summarize this lecture in concise bullet points.
```

---

## Last 5-Minute Summary

```js
Summarize the last 5 minutes of the lecture.
```

Filter transcript chunks based on current video timestamp.

---

# Timestamp Navigation

Frontend:

```js
videoRef.current.seekTo(seconds);
```

AI Response Example:

```text
The instructor explained overfitting at 12:42.
```

Clicking:
```text
12:42
```

jumps directly to the lecture moment.

---

# Session Memory

Store chat history:

```json
[
  {
    "role": "user",
    "message": "Explain gradient descent"
  }
]
```

Allows follow-up questions:
> “Explain it in simpler terms.”

---

# LMS Integration

Embed AI panel beside video player.

Layout:

```text
--------------------------------
|        Video Player          |
|                              |
--------------------------------
| AI Assistant Panel           |
| Ask doubts...                |
| Summaries                    |
| Timestamps                   |
--------------------------------
```

---

# Suggested UI Tabs

| Tab | Purpose |
|---|---|
| Chat | Contextual Q&A |
| Summary | Lecture summaries |
| Timeline | Jump-to-moment |
| Notes | Quick revision |
| Quiz | Auto-generated MCQs |

---

# Demo Flow

## 1. Open Lecture
Show LMS player + AI assistant.

---

## 2. Ask Question

Example:
> “What is backpropagation?”

AI responds with:
- contextual answer
- timestamp citation

---

## 3. Click Timestamp

Video jumps instantly.

---

## 4. Generate Summary

Click:
> “Summarize last 5 mins”

AI generates revision notes instantly.

---

# Future Scope

- multi-language support
- Hindi/Hinglish Q&A
- quiz generation
- auto notes export
- multi-video search
- personalized learning analytics

---

# Final Pitch Line

> “We built an AI-powered learning companion that transforms passive video lectures into an interactive, searchable, and personalized learning experience using contextual AI and real-time transcript understanding.”
