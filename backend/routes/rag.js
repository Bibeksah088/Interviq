import express from 'express';
import fetch from 'node-fetch';
import { protect } from '../middleware/auth.js';
import RagDocument from '../models/RagDocument.js';

const router = express.Router();

async function getEmbedding(text) {
  const KEY = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${KEY}`;
  const payload = {
    model: 'models/gemini-embedding-2',
    content: { parts: [{ text }] }
  };
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!r.ok) {
      const errText = await r.text();
      throw new Error(`Embedding failed: ${r.statusText} - ${errText}`);
  }
  const data = await r.json();
  return data.embedding.values;
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// POST /api/rag/upload - Upload and process knowledge base text
router.post('/upload', protect, async (req, res) => {
  const { filename, text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  try {
    // Chunk text (simple chunking by roughly 1000 characters, respecting paragraphs)
    const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    
    for (const p of paragraphs) {
      if ((currentChunk + p).length > 1000) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = p + '\n';
      } else {
        currentChunk += p + '\n';
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());

    // Get embeddings for each chunk
    const embeddedChunks = [];
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk);
      embeddedChunks.push({ text: chunk, embedding });
      // add small delay to avoid rate limits on free tier
      await new Promise(r => setTimeout(r, 250));
    }

    const doc = new RagDocument({
      userId: req.user._id,
      filename: filename || 'Knowledge Base',
      chunks: embeddedChunks
    });
    await doc.save();

    res.json({ documentId: doc._id, chunkCount: chunks.length });
  } catch (e) {
    console.error('RAG Upload Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/rag/search - Search RAG context
router.post('/search', protect, async (req, res) => {
  const { documentId, query } = req.body;
  if (!documentId || !query) return res.status(400).json({ error: 'documentId and query required' });

  try {
    const doc = await RagDocument.findById(documentId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const queryEmbedding = await getEmbedding(query);

    // Calculate similarity
    const scoredChunks = doc.chunks.map(chunk => ({
      text: chunk.text,
      score: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    // Sort descending and take top 3
    scoredChunks.sort((a, b) => b.score - a.score);
    const topContext = scoredChunks.slice(0, 3).map(c => c.text).join('\n\n---\n\n');

    res.json({ context: topContext });
  } catch (e) {
    console.error('RAG Search Error:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
