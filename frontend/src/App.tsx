import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Camera, Video, Send, Settings, 
  ChevronRight, Loader2, Award, CheckCircle, 
  AlertCircle, RotateCcw, User, Star, FileText, 
  BarChart, FileSearch, Code, Briefcase, FileUp, 
  Volume2, Zap, Trophy, Flame, Target, Building,
  Activity, LayoutDashboard, BrainCircuit, Lock, 
  Mail, LogOut, Sun, Moon, Menu, X, History,
  Database, Server, Cloud, HeartHandshake,
  UserPlus, LogIn, Shield
} from 'lucide-react';

// --- API Helper ---
// @ts-ignore
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '/api';

// Token management
const getToken = () => localStorage.getItem('auth_token');
const setToken = (token: string) => localStorage.setItem('auth_token', token);
const removeToken = () => localStorage.removeItem('auth_token');

async function callBackend(prompt: string, schema: object | null = null, deductCredit = false) {
  const url = `${BACKEND_URL}/generate`;
  const token = getToken();
  const delays = [1000, 2000, 4000, 8000];
  
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt, schema, deductCredit })
      });
      if (res.status === 401) throw new Error('AUTH_EXPIRED');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      const text = data.result;
      if (schema) return JSON.parse(text);
      return text;
    } catch (err: any) {
      if (err.message === 'AUTH_EXPIRED') throw err;
      if (attempt === 4) throw err;
      await new Promise(r => setTimeout(r, delays[attempt]));
    }
  }
}

async function apiRequest(endpoint: string, method = 'GET', body?: any) {
  const token = getToken();
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// --- Data ---
const COMPANIES = ['Agnostic (General)', 'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'TCS', 'Infosys', 'Wipro', 'Flipkart'];

const ROLE_TOPICS: Record<string, string[]> = {
  'Software Development Engineer (SDE)': ['Data Structures & Algorithms (DSA)', 'System Design', 'React & Frontend', 'Java & Spring Boot', 'Core CS (OS, DBMS, Networks)'],
  'Cybersecurity': ['Network Security', 'Cryptography', 'Penetration Testing', 'Incident Response', 'Web Application Security'],
  'Data Scientist': ['Statistical Modeling', 'Machine Learning Basics', 'SQL & Data Manipulation', 'Python (Pandas/NumPy)'],
  'Data Analytics': ['Data Visualization', 'SQL & Databases', 'Business Intelligence (Tableau/PowerBI)', 'A/B Testing'],
  'AI Engineer': ['Deep Learning', 'Natural Language Processing (NLP)', 'Computer Vision', 'Generative AI Architecture'],
  'ML Engineer': ['Machine Learning Algorithms', 'Model Deployment & MLOps', 'Feature Engineering', 'Deep Learning Frameworks'],
  'Cloud Engineer': ['AWS Architecture', 'Serverless Computing', 'Kubernetes & Docker', 'Cloud Security'],
  'HR & Management': ['Behavioral Round', 'HR Round', 'Leadership Principles', 'Conflict Resolution']
};

const turnSchema = {
  type: "OBJECT",
  properties: {
    evaluation: {
      type: "OBJECT",
      properties: {
        overallScore: { type: "NUMBER" },
        techScore: { type: "NUMBER" },
        commScore: { type: "NUMBER" },
        confidenceScore: { type: "NUMBER" },
        grammarScore: { type: "NUMBER" },
        feedback: { type: "ARRAY", items: { type: "STRING" } },
        detectedWeakness: { type: "STRING" }
      }
    },
    nextQuestion: { type: "STRING" },
    newDifficulty: { type: "STRING" },
    isCodingQuestion: { type: "BOOLEAN" },
    hint: { type: "STRING" }
  }
};

const resumeAnalysisSchema = {
  type: "OBJECT",
  properties: {
    atsScore: { type: "NUMBER" },
    jdMatchPercentage: { type: "NUMBER" },
    missingSkills: { type: "ARRAY", items: { type: "STRING" } },
    tips: { type: "ARRAY", items: { type: "STRING" } },
    extractedData: {
      type: "OBJECT",
      properties: {
        skills: { type: "ARRAY", items: { type: "STRING" } },
        education: { type: "ARRAY", items: { type: "STRING" } },
        experience: { type: "ARRAY", items: { type: "STRING" } },
        projects: { type: "ARRAY", items: { type: "STRING" } },
        technologies: { type: "ARRAY", items: { type: "STRING" } }
      }
    }
  }
};

// --- Types ---
interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  credits: number;
  xp: number;
  level: number;
  streak: number;
  lastLogin: string;
  badges: string[];
}

interface HistoryRecord {
  _id?: string;
  date: string;
  role: string;
  topic: string;
  company: string;
  score: string;
  xp: number;
  mode?: string;
  historyData?: HistoryItem[];
}

interface Config {
  company: string;
  role: string;
  difficulty: string;
  topic: string;
  language: string;
  jdText: string;
  resumeText: string;
  resumeFileName: string;
  ragDocId: string;
  ragFileName: string;
  practiceMode: boolean;
}

interface TurnData {
  evaluation?: {
    overallScore: number;
    techScore: number;
    commScore: number;
    confidenceScore: number;
    grammarScore: number;
    feedback: string[];
    detectedWeakness: string;
  } | null;
  nextQuestion: string;
  newDifficulty: string;
  isCodingQuestion: boolean;
  hint: string;
}

interface HistoryItem {
  q: TurnData;
  a: string;
  eval: TurnData['evaluation'];
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ==========================================
// LAYOUT WRAPPER
// ==========================================
const Layout = ({ children, isDark, setIsDark, currentUser, view, setView, isMobileMenuOpen, setIsMobileMenuOpen, logout }: any) => (
  <div className={`flex h-screen overflow-hidden ${isDark ? 'dark' : ''}`}>
    {currentUser && (
      <>
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 transition-colors duration-300 z-20">
          <div className="p-6 flex items-center space-x-3 text-indigo-600 dark:text-indigo-400 font-black text-xl tracking-tight cursor-pointer" onClick={() => setView('dashboard')}>
            <BrainCircuit className="w-8 h-8" /><span>Interviq</span>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            {[ { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
               { id: 'setup', icon: Video, label: 'Mock Interview' },
               { id: 'resume', icon: FileSearch, label: 'Resume AI' } ].map(item => (
              <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${view === item.id || (view==='interview' && item.id==='setup') || (view==='report' && item.id==='dashboard') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <item.icon className="w-5 h-5 mr-3" />{item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">THEME</span>
              <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
            <button onClick={logout} className="w-full flex items-center px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl font-bold transition-colors">
              <LogOut className="w-5 h-5 mr-3" /> Logout
            </button>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 flex items-center justify-between px-4">
          <div className="flex items-center text-indigo-600 font-bold"><BrainCircuit className="w-6 h-6 mr-2" /> Interviq</div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 dark:text-slate-300"><Menu className="w-6 h-6" /></button>
        </div>
        
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40" onClick={()=>setIsMobileMenuOpen(false)}>
            <div className="absolute right-0 top-16 bottom-0 w-64 bg-white dark:bg-slate-900 p-4 shadow-xl" onClick={e=>e.stopPropagation()}>
              <nav className="space-y-2">
                {['dashboard', 'setup', 'resume'].map(id => (
                  <button key={id} onClick={() => { setView(id); setIsMobileMenuOpen(false); }} className="w-full text-left p-4 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{id}</button>
                ))}
                <button onClick={() => setIsDark(!isDark)} className="w-full text-left p-4 font-bold text-slate-700 dark:text-slate-200">Toggle Theme</button>
                <button onClick={logout} className="w-full text-left p-4 font-bold text-red-500">Logout</button>
              </nav>
            </div>
          </div>
        )}
      </>
    )}

    {/* Main Content Area */}
    <main className={`flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300 ${currentUser ? 'pt-16 md:pt-0' : ''}`}>
      <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
        {children}
      </div>
    </main>
  </div>
);

// ==========================================
// MAIN APP
// ==========================================
export default function App() {
  // Theme State
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // Auth State
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  // App Navigation State
  const [view, setView] = useState('home'); // home, dashboard, setup, interview, report, resume
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userHistory, setUserHistory] = useState<HistoryRecord[]>([]);
  const [selectedInterviewForReport, setSelectedInterviewForReport] = useState<HistoryRecord | null>(null);

  // Interview Config State
  const [interviewMode, setInterviewMode] = useState('topic');
  const [config, setConfig] = useState<Config>({
    company: 'Agnostic (General)', role: 'Software Development Engineer (SDE)', difficulty: 'Medium',
    topic: 'Data Structures & Algorithms (DSA)', language: 'C++', jdText: '', resumeText: '', resumeFileName: '', ragDocId: '', ragFileName: '', practiceMode: false 
  });

  // Ensure topic matches role
  useEffect(() => {
    if (ROLE_TOPICS[config.role] && !ROLE_TOPICS[config.role].includes(config.topic)) {
      setConfig(prev => ({ ...prev, topic: ROLE_TOPICS[config.role][0] }));
    }
  }, [config.role]);

  // Active Interview State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentQuestionData, setCurrentQuestionData] = useState<TurnData | null>(null); 
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const MAX_QUESTIONS = 5;
  
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [hardwareError, setHardwareError] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [interruptionMsg, setInterruptionMsg] = useState('');

  // Resume State
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, reading, analyzing, success, error

  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any | null>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const isRecordingRef = useRef(false);

  // Load PDF.js
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // --- Auth: Check token on mount ---
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) { setAuthLoading(false); return; }
      try {
        const data = await apiRequest('/auth/me');
        setUserProfile(data.user);
        setIsAuthenticated(true);
        loadHistory();
        setView('dashboard');
      } catch {
        removeToken();
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await apiRequest('/users/history?limit=50');
      setUserHistory(data.history || []);
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  };

  // --- Auth Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const data = await apiRequest('/auth/login', 'POST', {
        email: authForm.email,
        password: authForm.password,
      });
      setToken(data.token);
      setUserProfile(data.user);
      setIsAuthenticated(true);
      loadHistory();
      setView('dashboard');
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (authForm.password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }
    setAuthLoading(true);
    try {
      const data = await apiRequest('/auth/register', 'POST', {
        name: authForm.name,
        email: authForm.email,
        password: authForm.password,
      });
      setToken(data.token);
      setUserProfile(data.user);
      setIsAuthenticated(true);
      loadHistory();
      setView('dashboard');
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    setIsAuthenticated(false);
    setUserProfile(null);
    setUserHistory([]);
    setView('home');
    setHistory([]);
    setQuestionCount(0);
    stopMedia();
  };

  // --- Media Sync ---
  useEffect(() => {
    if (videoRef.current && mediaStream && view === 'interview') {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, view]);

  const stopMedia = () => {
    if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); setMediaStream(null); }
    synthRef.current?.cancel();
    if (isRecordingRef.current && recognitionRef.current) {
      isRecordingRef.current = false; setIsRecording(false); recognitionRef.current.stop();
    }
  };

  // --- Voice Engine ---
  const toggleRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setHardwareError("Voice input not supported. Please type."); return; }
    if (isRecordingRef.current) {
      isRecordingRef.current = false; setIsRecording(false); recognitionRef.current?.stop();
    } else {
      setHardwareError(''); setInterruptionMsg('');
      isRecordingRef.current = true; setIsRecording(true); startRecognitionLoop();
    }
  };

  const startRecognitionLoop = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false; recognition.interimResults = false; recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setCurrentAnswer(prev => {
          const newText = prev + (prev.length > 0 ? ' ' : '') + transcript;
          if (newText.length > 600 && isRecordingRef.current) {
             isRecordingRef.current = false; setIsRecording(false); recognition.stop();
             setInterruptionMsg("AI Interrupted: Answer too long. Evaluating...");
             setTimeout(() => { submitAnswer(newText); }, 1500);
          }
          return newText;
        });
      }
    };
    recognition.onend = () => { if (isRecordingRef.current) { try { recognition.start(); } catch (e) {} } };
    recognition.onerror = (e: any) => { if (e.error === 'not-allowed') { isRecordingRef.current = false; setIsRecording(false); setHardwareError(`Mic blocked.`); } };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch (err) {}
  };

  // --- Interview Flow ---
  const startInterviewSetup = async () => {
    if (!userProfile || userProfile.credits < 1) { setHardwareError("Insufficient credits. Refill required."); return; }
    setHardwareError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaStream(stream);
      
      setView('interview');
      setHistory([]); setQuestionCount(0);
      await generateNextTurn(true);
    } catch (err) { setHardwareError("Camera/Mic access is required."); }
  };

  const speakText = (text: string | undefined) => {
    if (!synthRef.current || !text) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v => v.lang.includes('en-') && v.name.includes('Google')) || voices.find(v => v.name.includes('Female')) || voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.rate = 1.05; utterance.pitch = 1;
    utterance.onstart = () => setIsAiSpeaking(true); utterance.onend = () => setIsAiSpeaking(false); utterance.onerror = () => setIsAiSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const generateNextTurn = async (isFirst = false, forceAnswer: string | null = null) => {
    setIsAiLoading(true); setShowHint(false); setInterruptionMsg('');
    const ansToEvaluate = forceAnswer !== null ? forceAnswer : currentAnswer;

    try {
      let ctx = `Company: ${config.company}. Role: ${config.role}. Target Difficulty: ${config.difficulty}.\n`;
      if (interviewMode === 'topic') {
        ctx += `Focus Topic: ${config.topic}. `;
        if (config.topic.includes('DSA') || config.topic.includes('Algorithm'))
          ctx += `Language: ${config.language}. (Candidate writes optimized, comment-free code). `;
      } else if (interviewMode === 'jd') {
        ctx += `Job Description: "${config.jdText}". Align questions heavily with this JD. `;
      } else if (interviewMode === 'resume') {
        ctx += `Candidate's Resume: "${config.resumeText}". Probe their specific experiences deeply. `;
      } else if (interviewMode === 'tailored') {
        ctx += `Candidate's Resume: "${config.resumeText}". Job Description: "${config.jdText}". Ask questions that probe their resume experiences specifically checking if they meet the requirements of the job description. `;
      }

      if (config.ragDocId) {
        try {
           const ragQuery = isFirst ? `Core knowledge for ${config.role} and ${config.topic}` : `Candidate answered: ${ansToEvaluate}. Evaluate based on facts.`;
           const res = await apiRequest('/rag/search', 'POST', { documentId: config.ragDocId, query: ragQuery });
           if (res.context) {
             ctx += `\n[Reference Knowledge Base for factual accuracy]:\n${res.context}\n(Use this to strictly evaluate the candidate's answer and generate the next question).\n`;
           }
        } catch (e) { console.error('RAG Search failed', e); }
      }

      const histStr = history.map((h, i) => `Turn ${i + 1}:\nQ: ${h.q.nextQuestion}\nA: ${h.a}`).join('\n\n');
      const prompt = `You are an expert ${config.company !== 'Agnostic (General)' ? config.company : 'Tech'} AI Interviewer.
Context: ${ctx}
Progress: Q${questionCount + 1} of ${MAX_QUESTIONS}.
${isFirst ? `This is Turn 1. Introduce yourself briefly and ask the first technical/behavioral question.` :
`History:\n${histStr}\n\nCandidate's last answer: "${ansToEvaluate}".\n\nTask:\n1. Rigorously evaluate the last answer. Provide sub-scores. Identify detectedWeakness.\n2. Decide NEXT question. Adapt dynamically.\n3. Set newDifficulty.\n4. Provide a subtle hint. \n5. dont ask from same topic again and again\n6. - Behave exactly like a real human interviewer. - Be professional, direct and concise. 4. Give a short hint only if the answer was incorrect,Cover as many different subjects as possible during the interview. - Increase difficulty gradually based on performance..\n7.Never use phrases like: "Could you please", "Would you", "Can you please", "Take your time", "Great answer", "Excellent", "Nice work", "Well done", "Good job".`}`;

      const res: TurnData = await callBackend(prompt, turnSchema, isFirst);
      
      if (!isFirst) {
        setHistory(prev => { const h = [...prev]; h[h.length - 1].eval = res.evaluation ?? null; return h; });
      }

      if (questionCount >= MAX_QUESTIONS && !isFirst) { await finishInterviewAndCalculateXP(); return; }

      setHistory(prev => [...prev, { q: res, a: '', eval: null }]);
      setCurrentQuestionData(res);
      if (res.newDifficulty) setConfig(prev => ({...prev, difficulty: res.newDifficulty}));
      setCurrentAnswer(''); setQuestionCount(prev => prev + 1);
      speakText(res.nextQuestion);
    } catch (err: any) {
      if (err.message === 'AUTH_EXPIRED') { handleLogout(); return; }
      setInterruptionMsg("Connection to Backend lost. Ensure your Node.js server is running."); 
    } 
    finally { setIsAiLoading(false); }
  };

  const submitAnswer = async (forcedText: string | null = null) => {
    const textToSubmit = forcedText || currentAnswer;
    if (!textToSubmit.trim()) { setHardwareError("Please provide an answer."); return; }
    if (isRecordingRef.current) { isRecordingRef.current = false; setIsRecording(false); recognitionRef.current?.stop(); }
    setHistory(prev => { const h = [...prev]; h[h.length - 1].a = textToSubmit; return h; });
    await generateNextTurn(false, textToSubmit);
  };

  const finishInterviewAndCalculateXP = async () => {
    stopMedia();
    const validTurns = history.filter(h => h.eval && h.eval.overallScore > 0);
    const avgScore = validTurns.length > 0 ? (validTurns.reduce((acc, curr) => acc + (curr.eval?.overallScore ?? 0), 0) / validTurns.length) : 0;
    
    let creditsEarned = avgScore < 5 ? 3 : avgScore < 8 ? 2 : 1;
    const xpEarned = Math.round((avgScore * 10) + (config.difficulty === 'Hard' ? 50 : config.difficulty === 'Medium' ? 25 : 0));
    
    const questions = history.filter(h => h.a).map(h => ({
      question: h.q.nextQuestion,
      answer: h.a,
      evaluation: h.eval || undefined,
      difficulty: h.q.newDifficulty,
      isCodingQuestion: h.q.isCodingQuestion,
    }));

    try {
      const saveData = await apiRequest('/users/history', 'POST', {
        role: config.role,
        topic: config.topic,
        company: config.company,
        difficulty: config.difficulty,
        interviewMode,
        score: parseFloat(avgScore.toFixed(1)),
        xpEarned,
        creditsEarned,
        questions,
      });

      if (saveData.user && userProfile) {
        setUserProfile(prev => prev ? {
          ...prev,
          credits: saveData.user.credits,
          xp: saveData.user.xp,
          level: saveData.user.level,
          badges: saveData.user.badges,
        } : prev);
      }
      
      const newReport: HistoryRecord = {
        date: new Date().toISOString(),
        role: config.role,
        topic: config.topic,
        company: config.company,
        mode: interviewMode,
        score: parseFloat(avgScore.toFixed(1)).toString(),
        xp: xpEarned,
        historyData: history
      };

      setSelectedInterviewForReport(newReport);
      loadHistory();
    } catch (err) {
      console.error('Failed to save interview:', err);
    }
    
    setView('report');
  };

  // --- Resume Engine ---
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setHardwareError('');
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    setUploadStatus('reading_pdf'); setConfig(prev => ({...prev, resumeFileName: file.name}));
    try {
      const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i); const content = await page.getTextContent();
        fullText += content.items.map((s: any) => s.str).join(' ') + '\n';
      }
      setConfig(prev => ({...prev, resumeText: fullText}));
      setUploadStatus('idle');
    } catch (err) { setUploadStatus('error'); setHardwareError("Error extracting PDF text."); }
  };

  const handleRagUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setHardwareError('');
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    setUploadStatus('reading_pdf'); setConfig(prev => ({...prev, ragFileName: file.name}));
    try {
      const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i); const content = await page.getTextContent();
        fullText += content.items.map((s: any) => s.str).join(' ') + '\n';
      }
      
      const res = await apiRequest('/rag/upload', 'POST', { filename: file.name, text: fullText });
      setConfig(prev => ({...prev, ragDocId: res.documentId}));
      setUploadStatus('idle');
    } catch (err) { console.error(err); setUploadStatus('error'); setHardwareError("Error processing Knowledge Base for RAG."); }
  };

  const analyzeResumeATS = async () => {
    setHardwareError('');
    if (!config.resumeText.trim()) return;
    setUploadStatus('analyzing'); setIsAiLoading(true);
    try {
      const prompt = `Deeply analyze this resume for Role: ${config.role}, JD: "${config.jdText || 'Standard JD'}". 
      Extract structured data (Skills, Education, Experience, Projects, Technologies). Provide ATS score (0-100), JD Match % (0-100), missing skills, and tips.\nResume:\n${config.resumeText}`;
      const analysis = await callBackend(prompt, resumeAnalysisSchema);
      setResumeAnalysis(analysis);
      setUploadStatus('success');
    } catch (err: any) { 
      if (err.message === 'AUTH_EXPIRED') { handleLogout(); return; }
      setUploadStatus('error'); setHardwareError("Failed analysis."); 
    } 
    finally { setIsAiLoading(false); }
  };

  // ==========================================
  // RENDERERS
  // ==========================================
  const layoutProps = { isDark, setIsDark, currentUser: userProfile, view, setView, isMobileMenuOpen, setIsMobileMenuOpen, logout: handleLogout };

  // --- Views ---
  if (!isAuthenticated) {
    return (
      <Layout {...layoutProps}>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="max-w-md w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden">
            <div className="p-10 bg-gradient-to-br from-indigo-600 to-purple-600 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <BrainCircuit className="w-12 h-12 text-white mx-auto mb-4 drop-shadow-md" />
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Interviq</h2>
                <p className="text-indigo-100 font-medium">Your AI Career Copilot</p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              {authError && <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl border border-red-100 dark:border-red-800/50 flex items-center"><AlertCircle className="w-5 h-5 mr-2 shrink-0" />{authError}</div>}
              
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl mb-6">
                <button onClick={() => { setAuthView('login'); setAuthError(''); }} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${authView === 'login' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Sign In</button>
                <button onClick={() => { setAuthView('register'); setAuthError(''); }} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${authView === 'register' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Sign Up</button>
              </div>

              <form onSubmit={authView === 'login' ? handleLogin : handleRegister} className="space-y-4">
                {authView === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type="text" required value={authForm.name} onChange={e=>setAuthForm(p=>({...p, name: e.target.value}))} className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 font-bold transition-all dark:text-white" placeholder="John Doe" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="email" required value={authForm.email} onChange={e=>setAuthForm(p=>({...p, email: e.target.value}))} className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 font-bold transition-all dark:text-white" placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="password" required value={authForm.password} onChange={e=>setAuthForm(p=>({...p, password: e.target.value}))} className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 font-bold transition-all dark:text-white" placeholder="••••••••" />
                  </div>
                </div>
                <button type="submit" disabled={authLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg py-4 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-indigo-500/30 mt-4 disabled:opacity-50">
                  {authLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>{authView === 'login' ? 'Sign In Securely' : 'Create Account'}</span>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!userProfile && authLoading) return <Layout {...layoutProps}><div className="flex flex-col items-center justify-center h-full"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" /><p className="font-bold">Loading Workspace...</p></div></Layout>;

  return (
    <Layout {...layoutProps}>
      {/* ---------------- DASHBOARD ---------------- */}
      {view === 'dashboard' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black flex items-center"><Activity className="w-8 h-8 mr-3 text-indigo-600 dark:text-indigo-400" /> Analytics Dashboard</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Welcome back, {userProfile?.name || userProfile?.email}</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl flex items-center shadow-sm"><Zap className="w-5 h-5 text-green-500 mr-2"/> <span className="font-bold">{userProfile?.credits} Credits</span></div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl flex items-center shadow-sm"><Trophy className="w-5 h-5 text-yellow-500 mr-2"/> <span className="font-bold">Lvl {userProfile?.level}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
               <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4"><Target className="w-64 h-64" /></div>
               <div className="relative z-10">
                 <h3 className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-2">Total Experience</h3>
                 <div className="text-5xl font-black mb-6">{userProfile?.xp || 0} <span className="text-xl text-indigo-200 font-medium">XP</span></div>
                 <div className="space-y-2">
                   <div className="flex justify-between text-xs font-bold text-indigo-100"><span>Progress to Lvl {(userProfile?.level || 1) + 1}</span><span>{(userProfile?.xp || 0) % 500} / 500</span></div>
                   <div className="w-full bg-black/20 rounded-full h-3"><div className="bg-white h-3 rounded-full" style={{ width: `${(((userProfile?.xp || 0) % 500) / 500) * 100}%` }}></div></div>
                 </div>
               </div>
            </div>
            
            <div className="col-span-1 md:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <h3 className="font-bold flex items-center text-slate-700 dark:text-slate-200 mb-6"><BarChart className="w-5 h-5 mr-2 text-indigo-500" /> Recent Performance</h3>
              <div className="flex-1 flex items-end justify-between gap-2 h-32">
                {userHistory.slice(0, 10).reverse().map((record, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">{record.score}</div>
                    <div className="w-full bg-indigo-500 dark:bg-indigo-600 rounded-t-md transition-all hover:bg-indigo-400" style={{ height: `${(parseFloat(record.score) / 10) * 100}%`, minHeight: '10%' }}></div>
                  </div>
                ))}
                {userHistory.length === 0 && <div className="w-full text-center text-sm font-medium text-slate-400">Take an interview to see data</div>}
              </div>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-black text-lg flex items-center"><History className="w-5 h-5 mr-2 text-blue-500"/> Interview History</h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{userHistory.length} Sessions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                  <tr><th className="p-4 pl-6">Date</th><th className="p-4">Target</th><th className="p-4">Score</th><th className="p-4">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium">
                  {userHistory.map((h, index) => (
                    <tr key={h._id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 pl-6">{new Date(h.date).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{h.company}</div>
                        <div className="text-xs text-slate-500">{h.role}</div>
                      </td>
                      <td className="p-4"><div className="flex items-center font-black"><Star className="w-4 h-4 text-yellow-500 mr-1" /> {h.score}</div></td>
                      <td className="p-4">
                        <button onClick={() => { 
                          if(h.historyData) {
                            setSelectedInterviewForReport(h); 
                            setView('report'); 
                          } else {
                            alert("Detailed report data not available for this session.");
                          }
                        }} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">Review</button>
                      </td>
                    </tr>
                  ))}
                  {userHistory.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">No interviews recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SETUP INTERVIEW ---------------- */}
      {view === 'setup' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-black flex items-center"><Settings className="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400" /> New Mock Interview</h1>
              <div className="flex items-center px-3 py-1.5 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg font-black text-sm border border-green-200 dark:border-green-800/50 shadow-sm"><Zap className="w-4 h-4 mr-1"/> Cost: 1 Credit</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {Object.entries({ Company: [config.company, COMPANIES, 'company'], Role: [config.role, Object.keys(ROLE_TOPICS), 'role'], Difficulty: [config.difficulty, ['Easy', 'Medium', 'Hard'], 'difficulty'] }).map(([label, [val, opts, key]]) => (
                <div key={label}>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">{label}</label>
                  <select value={val as string} onChange={e => setConfig({...config, [key as string]: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 font-bold transition-all">
                    {(opts as string[]).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div className="mb-6 flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl">
               {['topic', 'jd', 'resume', 'tailored'].map(mode => (
                 <button key={mode} onClick={() => setInterviewMode(mode)} className={`flex-1 py-3 text-sm font-black rounded-lg capitalize transition-all ${interviewMode === mode ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>{mode === 'jd' ? 'Job Description' : mode === 'tailored' ? 'Resume + JD' : mode}</button>
               ))}
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
              {interviewMode === 'topic' && (
                <div className="space-y-4">
                  <select value={config.topic} onChange={e => setConfig({...config, topic: e.target.value})} className="w-full p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl outline-none font-bold">
                    {ROLE_TOPICS[config.role]?.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {(config.topic.includes('DSA') || config.topic.includes('Algorithm')) && (
                    <select value={config.language} onChange={e => setConfig({...config, language: e.target.value})} className="w-full p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl outline-none font-bold">
                      <option>C++</option><option>Python</option><option>Java</option><option>JavaScript</option>
                    </select>
                  )}
                </div>
              )}
              {(interviewMode === 'jd' || interviewMode === 'tailored') && <textarea value={config.jdText} onChange={e => setConfig({...config, jdText: e.target.value})} placeholder="Paste complete Job Description..." className="w-full h-40 p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl outline-none resize-none mb-4" />}
              {(interviewMode === 'resume' || interviewMode === 'tailored') && (
                 <div>
                   <label className="flex items-center justify-center w-full p-6 border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400 rounded-xl cursor-pointer font-bold mb-4 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                     {uploadStatus === 'reading_pdf' ? <Loader2 className="w-6 h-6 animate-spin mr-2"/> : <FileUp className="w-6 h-6 mr-3" />}
                     {uploadStatus === 'reading_pdf' ? 'Parsing PDF...' : config.resumeFileName || 'Upload PDF Resume'}
                     <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={uploadStatus === 'reading_pdf'} />
                   </label>
                   {config.resumeText && <div className="text-xs font-bold text-green-600 flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> Resume Parsed ({config.resumeText.length} chars)</div>}
                 </div>
              )}
            </div>

            <label className="flex items-center space-x-4 cursor-pointer p-4 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/10 transition-colors mb-6">
              <input type="checkbox" checked={config.practiceMode} onChange={e => setConfig({...config, practiceMode: e.target.checked})} className="w-6 h-6 text-indigo-600 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700" />
              <div><span className="block text-sm font-black text-indigo-900 dark:text-indigo-300">Practice Mode</span><span className="block text-xs font-medium text-indigo-700 dark:text-indigo-400">AI provides subtle hints when stuck.</span></div>
            </label>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Optional: Upload Knowledge Base (RAG)</label>
              <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                {uploadStatus === 'reading_pdf' && !config.resumeFileName ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Database className="w-5 h-5 mr-3" />}
                <span className="text-sm font-bold">{config.ragFileName || 'Upload Study Material/Docs (PDF)'}</span>
                <input type="file" accept=".pdf" className="hidden" onChange={handleRagUpload} disabled={uploadStatus === 'reading_pdf'} />
              </label>
              {config.ragDocId && <div className="text-xs font-bold text-green-600 mt-2 flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> RAG Knowledge Base Indexed!</div>}
            </div>

            {hardwareError && <div className="p-4 mb-6 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl flex items-center text-sm font-bold border border-red-200 dark:border-red-800/50"><AlertCircle className="w-5 h-5 shrink-0 mr-2" />{hardwareError}</div>}
            
            <button onClick={startInterviewSetup} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-5 rounded-xl font-black text-lg transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center">
              <Video className="w-6 h-6 mr-3" /> Start Environment
            </button>
          </div>
        </div>
      )}

      {/* ---------------- ACTIVE INTERVIEW ---------------- */}
      {view === 'interview' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in zoom-in-95 h-full max-h-[85vh]">
          <div className="lg:col-span-3 flex flex-col h-full space-y-4">
            
            {/* AI Output Area */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex-shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><BrainCircuit className="w-32 h-32"/></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex space-x-2">
                   <span className="px-3 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-full shadow-sm">Q {questionCount} / {MAX_QUESTIONS}</span>
                   <span className={`px-3 py-1 font-bold text-xs rounded-full shadow-sm ${config.difficulty==='Hard'?'bg-red-100 text-red-700':config.difficulty==='Medium'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>{config.difficulty}</span>
                </div>
                <button onClick={() => speakText(currentQuestionData?.nextQuestion)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full shadow-sm hover:scale-110 transition-transform"><Volume2 className="w-4 h-4" /></button>
              </div>
              <h2 className="text-xl md:text-2xl font-bold leading-relaxed relative z-10 min-h-[80px]">
                {isAiLoading && questionCount === 0 ? <div className="flex items-center text-indigo-600 dark:text-indigo-400"><Loader2 className="w-6 h-6 animate-spin mr-3"/> Establishing AI Connection...</div> : currentQuestionData?.nextQuestion}
              </h2>
            </div>

            {/* Input Area */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col flex-1 min-h-[300px]">
              <div className="border-b border-slate-100 dark:border-slate-800 p-3 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50 rounded-t-3xl">
                <span className="font-bold text-sm flex items-center text-slate-700 dark:text-slate-300">{currentQuestionData?.isCodingQuestion ? <Code className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />} {currentQuestionData?.isCodingQuestion ? `Editor (${config.language})` : 'Console'}</span>
                {config.practiceMode && currentQuestionData?.hint && <button onClick={() => setShowHint(!showHint)} className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-bold"><Zap className="w-3 h-3 inline mr-1" />{showHint ? 'Hide Hint' : 'Show Hint'}</button>}
              </div>
              
              <div className="flex-1 p-4 relative flex flex-col">
                {showHint && <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-sm font-bold text-indigo-800 dark:text-indigo-300 animate-in slide-in-from-top-2">💡 <strong>Hint:</strong> {currentQuestionData?.hint}</div>}
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder={currentQuestionData?.isCodingQuestion ? `// Implement optimized solution in ${config.language}...` : "Input response..."}
                  className={`w-full flex-1 p-4 bg-transparent border-0 focus:ring-0 resize-none outline-none ${currentQuestionData?.isCodingQuestion ? 'font-mono text-sm bg-slate-50 dark:bg-slate-950 rounded-xl' : 'text-lg'}`}
                  disabled={isAiLoading || interruptionMsg !== ''}
                  spellCheck={!currentQuestionData?.isCodingQuestion}
                />
                {interruptionMsg && <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in"><AlertCircle className="w-12 h-12 text-red-500 mb-4" /><p className="text-white font-black text-xl">{interruptionMsg}</p></div>}
                {isRecording && !interruptionMsg && !currentQuestionData?.isCodingQuestion && <div className="absolute bottom-6 right-6 bg-red-500 text-white px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest animate-pulse shadow-lg flex items-center"><div className="w-2 h-2 bg-white rounded-full mr-2"></div>Listening</div>}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 bg-slate-50/50 dark:bg-slate-950/50 rounded-b-3xl">
                {!currentQuestionData?.isCodingQuestion && (
                  <button onClick={toggleRecording} disabled={isAiLoading || interruptionMsg !== ''} className={`flex items-center justify-center px-6 py-4 rounded-xl font-bold transition-all w-full sm:w-auto shadow-sm border ${isRecording ? 'bg-red-50 dark:bg-red-500/10 text-red-600 border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                    {isRecording ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />} {isRecording ? 'Stop Voice' : 'Start Voice'}
                  </button>
                )}
                <button onClick={() => submitAnswer(null)} disabled={isAiLoading || !currentAnswer.trim() || interruptionMsg !== ''} className="flex-1 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-black transition-all shadow-lg disabled:opacity-50">
                  {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Compile & Submit</span><Send className="w-4 h-4 ml-2" /></>}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
              <div className="absolute top-4 left-4 flex items-center bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded text-[10px] font-black uppercase"><Building className="w-3 h-3 mr-1"/> {config.company}</div>
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 mt-4">Interviewer Node</h3>
              <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center bg-slate-900 rounded-full border-4 border-slate-800 shadow-xl overflow-hidden">
                {isAiSpeaking && <div className="absolute inset-0 bg-blue-500/20 animate-ping rounded-full"></div>}
                <svg viewBox="0 0 100 100" className="w-20 h-20 text-white z-10">
                  <circle cx="50" cy="50" r="45" fill="#1e293b" />
                  <circle cx="35" cy="40" r="5" fill="#3b82f6" className={isAiLoading ? 'animate-pulse' : ''} />
                  <circle cx="65" cy="40" r="5" fill="#3b82f6" className={isAiLoading ? 'animate-pulse' : ''} />
                  <rect x="35" y="65" width="30" height={isAiSpeaking ? "12" : "3"} rx="1.5" fill="white" style={{ transformOrigin: '50% 65%' }} />
                </svg>
              </div>
            </div>
            <div className="bg-black rounded-3xl overflow-hidden shadow-xl relative aspect-square border-4 border-slate-800">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full flex items-center text-white text-[10px] font-black tracking-widest border border-white/10"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></div>LIVE</div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- REPORT & HISTORY ---------------- */}
      {view === 'report' && selectedInterviewForReport && (
        <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 pb-12">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 translate-x-1/4 -translate-y-1/4"><Award className="w-96 h-96"/></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
              <div>
                <div className="flex gap-2 mb-4"><span className="px-3 py-1 bg-white/20 rounded-md text-xs font-black uppercase">{selectedInterviewForReport.company}</span><span className="px-3 py-1 bg-indigo-500/50 rounded-md text-xs font-black uppercase">{selectedInterviewForReport.mode || 'topic'}</span></div>
                <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">Post-Mortem Report</h1>
                <p className="text-indigo-200 font-medium">{new Date(selectedInterviewForReport.date).toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-center bg-white/10 p-8 rounded-3xl backdrop-blur-md border border-white/10 shadow-inner">
                <span className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-1">Final Score</span>
                <div className="text-7xl font-black">{selectedInterviewForReport.score}<span className="text-2xl text-indigo-300 font-bold">/10</span></div>
                <div className="mt-2 text-sm font-bold text-green-400">+{selectedInterviewForReport.xp} XP</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {selectedInterviewForReport.historyData?.map((item: HistoryItem, index: number) => {
              if (!item.a || !item.eval) return null;
              return (
                <div key={index} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="bg-slate-50/80 dark:bg-slate-950/80 p-6 md:p-8 border-b border-slate-100 dark:border-slate-800"><h3 className="font-bold text-lg">{item.q.nextQuestion}</h3></div>
                  <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="flex items-center text-xs font-black text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-widest"><User className="w-4 h-4 mr-2" /> Candidate Output</h4>
                      <div className="text-sm font-medium leading-relaxed bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto">{item.a}</div>
                    </div>
                    <div className="space-y-6">
                      <h4 className="flex items-center text-xs font-black text-indigo-500 dark:text-indigo-400 mb-4 uppercase tracking-widest"><Server className="w-4 h-4 mr-2" /> Telemetry</h4>
                      <div className="grid grid-cols-2 gap-4">
                         {Object.entries({ Tech: item.eval.techScore, Comm: item.eval.commScore, Conf: item.eval.confidenceScore, Gram: item.eval.grammarScore }).map(([key, val]) => (
                           <div key={key} className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-2xl flex flex-col items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shadow-inner">
                             <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{val}</span><span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{key}</span>
                           </div>
                         ))}
                      </div>
                      <h4 className="flex items-center text-xs font-black text-green-500 mb-2 uppercase tracking-widest mt-6"><Award className="w-4 h-4 mr-2" /> Optimizations</h4>
                      <ul className="space-y-3">
                        {item.eval.feedback?.map((tip, i) => (
                          <li key={i} className="flex items-start text-sm bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800"><CheckCircle className="w-4 h-4 text-green-500 mr-3 shrink-0" /><span className="font-bold text-slate-700 dark:text-slate-300">{tip}</span></li>
                        ))}
                      </ul>
                      {item.eval.detectedWeakness && item.eval.detectedWeakness !== 'None' && (
                         <div className="mt-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/50 rounded-xl text-xs font-black text-red-600 dark:text-red-400 flex items-center">
                           <Target className="w-4 h-4 mr-2 shrink-0"/> WEAKNESS DETECTED: {item.eval.detectedWeakness}
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center pt-8">
            <button onClick={() => setView('dashboard')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-xl font-black transition-all shadow-xl"><LayoutDashboard className="w-5 h-5 inline mr-2" /> Back to Dashboard</button>
          </div>
        </div>
      )}

      {/* ---------------- RESUME INTELLIGENCE ---------------- */}
      {view === 'resume' && (
        <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 pb-12">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-8 md:p-12 bg-gradient-to-br from-slate-900 to-indigo-950 text-white relative">
              <Database className="absolute right-0 top-0 w-64 h-64 opacity-10 translate-x-8 -translate-y-8" />
              <h2 className="text-3xl md:text-4xl font-black mb-4 flex items-center relative z-10"><FileSearch className="w-8 h-8 mr-4 text-blue-400" /> Resume Parser Engine</h2>
              <p className="text-slate-300 font-medium max-w-2xl relative z-10">Extract critical data points, evaluate ATS compatibility, and uncover missing keywords mapped against a specific Job Description.</p>
            </div>
            
            <div className="p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Target Profile</label>
                    <select value={config.role} onChange={e => setConfig({...config, role: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold">
                      {Object.keys(ROLE_TOPICS).map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                  <div>
                     <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Document Upload (.PDF)</label>
                     <label className="flex items-center justify-center w-full p-8 border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400 rounded-2xl cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors font-black text-lg">
                       {uploadStatus === 'reading_pdf' ? <Loader2 className="w-6 h-6 animate-spin mr-3"/> : <FileUp className="w-6 h-6 mr-3" />}
                       {uploadStatus === 'reading_pdf' ? 'Extracting Text...' : config.resumeFileName || 'Drop PDF Here'}
                       <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={uploadStatus === 'reading_pdf'} />
                     </label>
                  </div>
                </div>
                <div>
                   <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Job Description (JD Match)</label>
                   <textarea value={config.jdText} onChange={(e) => setConfig({...config, jdText: e.target.value})} placeholder="Paste job requirements here..." className="w-full h-full min-h-[200px] p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none resize-none text-sm font-medium" />
                </div>
              </div>
              
              {hardwareError && <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-bold border border-red-100 dark:border-red-800/50 flex items-center"><AlertCircle className="w-5 h-5 mr-2" />{hardwareError}</div>}
              
              <button onClick={analyzeResumeATS} disabled={isAiLoading || !config.resumeText.trim() || uploadStatus === 'reading_pdf'} className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white p-5 rounded-2xl font-black text-lg transition-all shadow-xl disabled:opacity-50 flex items-center justify-center">
                {isAiLoading ? <><Loader2 className="w-6 h-6 animate-spin mr-3" /><span>Running Neural Analysis...</span></> : <><Cloud className="w-6 h-6 mr-3" /><span>Generate Intelligence Profile</span></>}
              </button>
            </div>
          </div>

          {resumeAnalysis && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-8">
              <div className="grid grid-cols-1 lg:grid-cols-3">
                <div className="p-8 lg:p-10 bg-slate-50/50 dark:bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center gap-12">
                  <div className="text-center w-full">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6 block">ATS Score</span>
                    <div className="relative w-40 h-40 mx-auto flex items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-xl border-4 border-slate-100 dark:border-slate-800">
                       <div className={`absolute inset-0 rounded-full border-[6px] opacity-80 ${resumeAnalysis.atsScore >= 80 ? 'border-green-500' : resumeAnalysis.atsScore >= 50 ? 'border-yellow-500' : 'border-red-500'}`} style={{ clipPath: `polygon(0 0, 100% 0, 100% ${100 - resumeAnalysis.atsScore}%, 0 ${100 - resumeAnalysis.atsScore}%)` }}></div>
                       <span className="text-5xl font-black">{resumeAnalysis.atsScore}</span>
                    </div>
                  </div>
                  {config.jdText && (
                    <div className="text-center w-full pt-8 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 block">JD Alignment</span>
                      <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{resumeAnalysis.jdMatchPercentage}%</div>
                    </div>
                  )}
                </div>
                
                <div className="p-8 lg:p-10 lg:col-span-2 space-y-8">
                  {resumeAnalysis.extractedData && (
                    <div className="space-y-6">
                       <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center"><Database className="w-4 h-4 mr-2" /> Extracted Vectors</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {Object.entries(resumeAnalysis.extractedData).map(([key, arr]) => {
                           if(!arr || (arr as any[]).length === 0) return null;
                           return (
                             <div key={key} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 block mb-2">{key}</span>
                               <div className="flex flex-wrap gap-1">
                                 {(arr as string[]).map((item, i) => <span key={i} className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded">{item}</span>)}
                               </div>
                             </div>
                           );
                         })}
                       </div>
                    </div>
                  )}

                  {resumeAnalysis.missingSkills?.length > 0 && (
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center mb-4"><Target className="w-4 h-4 mr-2" /> Missing Keywords (JD Gap)</h3>
                      <div className="flex flex-wrap gap-2">
                         {resumeAnalysis.missingSkills.map((skill: string, i: number) => <span key={i} className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 font-bold text-xs rounded-lg border border-red-100 dark:border-red-900/30">{skill}</span>)}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-black text-green-500 uppercase tracking-widest flex items-center mb-4"><Award className="w-4 h-4 mr-2" /> Strategic Advice</h3>
                    <ul className="space-y-3">
                      {resumeAnalysis.tips.map((tip: string, i: number) => (
                        <li key={i} className="flex items-start bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm"><span className="text-slate-700 dark:text-slate-300 font-bold text-sm leading-relaxed">{tip}</span></li>
                      ))}
                    </ul>
                  </div>

                  <button onClick={() => { setInterviewMode(config.jdText.trim() ? 'tailored' : 'resume'); setView('setup'); }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-2xl font-black transition-all shadow-xl shadow-indigo-500/20 mt-4 flex justify-center items-center">
                    <Video className="w-5 h-5 mr-3" /> Initialize Mock Interview with this Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
