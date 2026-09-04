import mongoose from 'mongoose';

const ChunkSchema = new mongoose.Schema({
  text: String,
  embedding: [Number]
});

const RagDocumentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  filename: String,
  chunks: [ChunkSchema],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('RagDocument', RagDocumentSchema);
