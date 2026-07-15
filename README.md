
<div align="center">
 
  <h1>Interviq (GenAI interviewer )</h1>
  <p><strong>Your AI Career Copilot & Mock Interview Environment</strong></p>
</div>

Interviq is a full-stack, AI-driven platform designed to prepare candidates for real-world job interviews. It simulates a live interview environment using voice interactions, dynamically adjusting questions based on a given Job Description (JD), Resume, and candidate performance.

## ✨ Key Features

-  **Voice-Interactive AI Interviewer**: Uses the browser's native Web Speech API to transcribe your voice and an animated AI persona to speak back, creating a realistic interview flow.
-  **Powered by Google Gemini AI**: Generates context-aware technical and behavioral questions, dynamically adjusting the difficulty based on your answers.
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

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local instance or MongoDB Atlas URL)
- A Google Gemini API Key



##  How to Use

1. **Create an Account**: Register a new user account (starts with 5 credits).
2. **Setup an Interview**: Go to "Mock Interview", paste a Job Description, and optionally paste your Resume.
3. **Start the Environment**: The AI will greet you and ask the first question. Click **"Start Voice"**, speak your answer, and click **"Compile & Submit"**.
4. **Review Report**: Once the interview concludes (or if you hit the max questions), visit the Dashboard to review your full Post-Mortem Report.


## Demo Video

[![Watch the Demo](https://usersnap.com/blog/wp-content/uploads/2016/08/click-me-button-flat.png)](https://youtu.be/eKz9khFPUxI)


