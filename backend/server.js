require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const emailRoutes = require('./routes/emails');
const promptRoutes = require('./routes/prompts');
const processRoutes = require('./routes/process');
const draftRoutes = require('./routes/drafts');
const agentRoutes = require('./routes/agent');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:3001',
    'https://email-agent-jade.vercel.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/emails', emailRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/process', processRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/agent', agentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Email Productivity Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: true, 
    message: `Route ${req.originalUrl} not found` 
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Email Productivity Backend running on port ${PORT}`);
  console.log(`📧 API available at: http://0.0.0.0:${PORT}/api`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/api/health`);
});
