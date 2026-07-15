import express from 'express';
import fetch from 'node-fetch';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

const MODELS = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite"
];

async function tryGemini(prompt, schema) {
  const KEY = process.env.GEMINI_API_KEY;
  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`;
    let payload = { contents: [{ parts: [{ text: prompt }] }] };
    if (schema) payload.generationConfig = { responseMimeType: 'application/json', responseSchema: schema };

    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await r.json();
      console.log(`[${model}] status=${r.status}`);

      if (!r.ok) { console.log('Error body:', JSON.stringify(data).slice(0, 200)); continue; }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) { console.log(`✅ Success with ${model}`); return text; }
    } catch (e) {
      console.log(`[${model}] fetch error:`, e.message);
    }
  }
  throw new Error('All models failed');
}

// POST /api/generate — protected, deducts credit for interview start
router.post('/', protect, async (req, res) => {
  const { prompt, schema, deductCredit } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  try {
    let user;
    if (deductCredit) {
      user = await User.findById(req.user._id);
      if (user.credits < 1) {
        return res.status(403).json({ error: 'Insufficient credits' });
      }
    }

    const text = await tryGemini(prompt, schema);

    if (deductCredit && user) {
      user.credits -= 1;
      await user.save();
    }

    res.json({ result: text });
  } catch (e) {
    console.error('Final error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
