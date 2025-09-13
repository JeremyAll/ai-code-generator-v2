import express from 'express';
import cors from 'cors';
import { GenerationQueue } from './src/generation-queue.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const queue = new GenerationQueue();

app.use(cors());
app.use(express.json());

// Initialiser la queue
queue.init();

// WebSocket pour streaming (optionnel)
import { createServer } from 'http';
import { Server } from 'socket.io';

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Écouter les événements de la queue
queue.on('job:created', (job) => {
  io.emit('job:created', job);
});

queue.on('job:updated', (job) => {
  io.emit('job:progress', {
    id: job.id,
    progress: job.progress,
    status: job.status,
    steps: job.steps
  });
});

queue.on('job:completed', (job) => {
  io.emit('job:completed', job);
});

// ENDPOINTS API

// Créer un job de génération
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, metadata } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }

    // Ajouter à la queue
    const jobId = await queue.addJob(prompt, metadata);

    res.json({
      success: true,
      jobId,
      message: 'Generation started',
      statusUrl: `/api/status/${jobId}`
    });

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Vérifier le statut d'un job
app.get('/api/status/:jobId', async (req, res) => {
  try {
    const job = await queue.getJob(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    res.json(job);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Récupérer le résultat
app.get('/api/result/:jobId', async (req, res) => {
  try {
    const job = await queue.getJob(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    if (job.status !== 'completed') {
      return res.status(202).json({
        message: 'Generation in progress',
        status: job.status,
        progress: job.progress
      });
    }

    res.json({
      success: true,
      result: job.result,
      metadata: job.metadata,
      duration: (job.completedAt - job.startedAt) / 1000
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    queueSize: queue.queue.length,
    processing: queue.processing
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
🚀 Generation API Server
📍 http://localhost:${PORT}
📡 WebSocket enabled for real-time updates
📦 Queue system active
  `);
});