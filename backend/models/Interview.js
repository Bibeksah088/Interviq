import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: String,
  answer: String,
  evaluation: {
    overallScore: Number,
    techScore: Number,
    commScore: Number,
    confidenceScore: Number,
    grammarScore: Number,
    feedback: [String],
    detectedWeakness: String,
  },
  difficulty: String,
  isCodingQuestion: Boolean,
}, { _id: false });

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  role: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    default: 'Medium',
  },
  interviewMode: {
    type: String,
    enum: ['topic', 'jd', 'resume'],
    default: 'topic',
  },
  score: {
    type: Number,
    default: 0,
  },
  xpEarned: {
    type: Number,
    default: 0,
  },
  creditsEarned: {
    type: Number,
    default: 0,
  },
  questions: [questionSchema],
}, {
  timestamps: true,
});

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
