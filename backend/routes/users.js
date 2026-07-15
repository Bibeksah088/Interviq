import express from 'express';
import User from '../models/User.js';
import Interview from '../models/Interview.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes below require authentication
router.use(protect);

// GET /api/users/profile — get own profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get interview count
    const interviewCount = await Interview.countDocuments({ userId: req.user._id });

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        credits: user.credits,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        lastLogin: user.lastLogin,
        badges: user.badges,
        interviewCount,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/profile — update own profile fields
router.put('/profile', async (req, res) => {
  try {
    const allowedFields = ['name', 'credits', 'xp', 'level', 'streak', 'lastLogin', 'badges'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Recalculate level from xp if xp is being updated
    if (updates.xp !== undefined) {
      updates.level = Math.floor(updates.xp / 500) + 1;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        credits: user.credits,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        lastLogin: user.lastLogin,
        badges: user.badges,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/history — get own interview history (paginated)
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [interviews, total] = await Promise.all([
      Interview.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Interview.countDocuments({ userId: req.user._id }),
    ]);

    // Format for frontend HistoryRecord compatibility
    const history = interviews.map(i => ({
      _id: i._id,
      date: i.createdAt.toISOString(),
      role: i.role,
      topic: i.topic,
      company: i.company,
      score: i.score.toFixed(1),
      xp: i.xpEarned,
      difficulty: i.difficulty,
      interviewMode: i.interviewMode,
      questionCount: i.questions?.length || 0,
    }));

    res.json({
      history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users/history — save a completed interview
router.post('/history', async (req, res) => {
  try {
    const { role, topic, company, difficulty, interviewMode, score, xpEarned, creditsEarned, questions } = req.body;

    if (!role || !topic || !company) {
      return res.status(400).json({ error: 'role, topic, and company are required' });
    }

    // Create interview record
    const interview = await Interview.create({
      userId: req.user._id,
      role,
      topic,
      company,
      difficulty: difficulty || 'Medium',
      interviewMode: interviewMode || 'topic',
      score: score || 0,
      xpEarned: xpEarned || 0,
      creditsEarned: creditsEarned || 0,
      questions: questions || [],
    });

    // Update user profile: add XP, credits, badges, recalculate level
    const user = await User.findById(req.user._id);
    user.xp += (xpEarned || 0);
    user.credits += (creditsEarned || 0);
    user.level = Math.floor(user.xp / 500) + 1;

    // Badge logic
    if (score >= 9 && !user.badges.includes('Perfect Ace')) {
      user.badges.push('Perfect Ace');
    }
    const totalInterviews = await Interview.countDocuments({ userId: req.user._id });
    if (totalInterviews >= 5 && !user.badges.includes('Consistency Master')) {
      user.badges.push('Consistency Master');
    }
    if (totalInterviews >= 10 && !user.badges.includes('Interview Veteran')) {
      user.badges.push('Interview Veteran');
    }
    if (user.streak >= 7 && !user.badges.includes('Week Warrior')) {
      user.badges.push('Week Warrior');
    }

    await user.save();

    res.status(201).json({
      interview: {
        _id: interview._id,
        date: interview.createdAt.toISOString(),
        role: interview.role,
        topic: interview.topic,
        company: interview.company,
        score: interview.score.toFixed(1),
        xp: interview.xpEarned,
      },
      user: {
        credits: user.credits,
        xp: user.xp,
        level: user.level,
        badges: user.badges,
      },
    });
  } catch (error) {
    console.error('Save history error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/history/:id — get a specific interview detail
router.get('/history/:id', async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json({ interview });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
