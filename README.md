
<div align="center">
 
  <h1>Interviq (GenAI interviewer )</h1>
  <p><strong>Your AI Career Copilot & Mock Interview Environment</strong></p>
</div>

Interviq is a full-stack, AI-driven platform designed to prepare candidates for real-world job interviews. It simulates a live interview environment using voice interactions, dynamically adjusting questions based on a given Job Description (JD), Resume, and candidate performance.

## ✨ Key Features

-  **Voice-Interactive AI Interviewer**: Uses the browser's native Web Speech API to transcribe your voice and an animated AI persona to speak back, creating a realistic interview flow.
-  **Powered by Google Gemini AI**: Generates context-aware technical and behavioral questions, dynamically adjusting the difficulty based on your answers.
-  **Tailored Interviews (Resume + JD)**: Dynamically probes candidates by cross-referencing their specific resume experiences against strict Job Description requirements.
-  **RAG Knowledge Base**: Custom Retrieval-Augmented Generation (RAG) using Gemini Embeddings and MongoDB Vector Search. Upload massive textbooks or coding docs to fact-check the AI's evaluations and prevent hallucinations.
-  **ATS Resume Analyzer**: Instantly parses uploaded resumes against a Job Description, extracting skills, calculating an ATS match score, and suggesting missing keywords.
-  **Gamification System**: Stay motivated with an integrated XP, Level, and Credit system. Gain XP for strong interview performances!
- **Post-Mortem Analytics**: Receive a detailed evaluation after every interview, featuring sub-scores (Communication vs Technical) and actionable feedback.
-  **Premium UI/UX**: Built with a sleek, responsive design featuring dark/light mode persistence, sidebar navigation, and subtle micro-animations.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 (Bootstrapped with Vite)
- **Styling**: Tailwind CSS v3.4 (with custom animation utilities)
- **Icons**: Lucide React
- **Voice APIs**: HTML5 `SpeechRecognition` and `SpeechSynthesis`

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JSON Web Tokens (JWT)
- **AI Engine**: `@google/genai` (Gemini API)
- **Vector Search / RAG**: Custom Cosine Similarity with Gemini Embeddings


 📁 Project Structure                                                                     
```text
Interviq/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       └── main.jsx
│
└── backend/
    ├── config/
    ├── middleware/
    ├── models/
    │   ├── RagDocument.js   # Vector Search Embeddings Schema
    │   └── User.js
    ├── routes/
    │   ├── rag.js           # RAG Chunking & Cosine Similarity Engine
    │   ├── generate.js      # Core Interview Generation
    │   └── auth.js
    └── server.js
```
## ☁️ Cloud Deployment

```text
                         Internet
                            │
                            ▼
                    ┌───────────────┐
                    │   AWS EC2     │
                    │ Ubuntu Server │
                    └───────┬───────┘
                            │
                         Nginx
                       Port 80
                            │
              ┌───────────────────────────────┐
              │                               │
              ▼                               ▼
       React Frontend              Node.js Backend
       /var/www/interviq             PM2 :5000
                                          │
                         ┌────────────────┬────────────────┐
                         │                │                │
                         ▼                ▼                ▼
                   MongoDB Atlas     Gemini API     Gemini Embeddings
                   (Vector DB)     (Generation)     (RAG Chunking)
```





      

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local instance or MongoDB Atlas URL)
- A Google Gemini API Key



##  How to Use

1. **Create an Account**: Register a new user account (starts with 5 credits).
2. **Setup an Interview**: Go to "Mock Interview". Select your interview mode (Topic, JD, Resume, or Tailored).
3. **Upload Knowledge Base (Optional)**: Upload a massive PDF (e.g., textbook, documentation). The RAG engine will chunk and embed it to fact-check your answers.
4. **Start the Environment**: The AI will greet you and ask the first question. Click **"Start Voice"**, speak your answer, and click **"Compile & Submit"**.
5. **Review Report**: Once the interview concludes, visit the Dashboard to review your full Post-Mortem Report.

## 🚀 Live Demo

🌐 **Vercel:** [Interviq Live Demo](https://interviq.vercel.app)

☁️ **AWS:** [AWS Live Server](http://13.49.181.38)


## Demo Video

[![Watch the Demo](https://usersnap.com/blog/wp-content/uploads/2016/08/click-me-button-flat.png)](https://youtu.be/eKz9khFPUxI)


