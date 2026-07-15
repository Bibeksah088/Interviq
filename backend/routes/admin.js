import express from 'express';
import User from '../models/User.js';
import Interview from '../models/Interview.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All routes require auth + admin role
router.use(protect, adminOnly);

// GET /api/admin/stats — platform overview stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalInterviews, recentInterviews] = await Promise.all([
      User.countDocuments(),
      Interview.countDocuments(),
      Interview.find().sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    const avgScore = recentInterviews.length > 0
      ? (recentInterviews.reduce((sum, i) => sum + i.score, 0) / recentInterviews.length).toFixed(1)
      : 0;

    // Interviews per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyInterviews = await Interview.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({
      stats: {
        totalUsers,
        totalInterviews,
        avgScore: parseFloat(avgScore),
        weeklyInterviews,
        activeUsers: await User.countDocuments({
          lastLogin: new Date().toDateString(),
        }),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/users — list all users
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);

    // Attach interview count for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const interviewCount = await Interview.countDocuments({ userId: user._id });
        return { ...user, interviewCount };
      })
    );

    res.json({
      users: usersWithStats,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/users/:id — get specific user with history
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const interviews = await Interview.find({ userId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ user, interviews });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/users/:id/role — change user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "user" or "admin"' });
    }

    // Prevent self-demotion
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/users/:id — delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Delete user's interviews first
    await Interview.deleteMany({ userId: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
