const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const path = require('path');
require('dotenv').config();

// Services
const notificationService = require('./services/notificationService');
const alarmService = require('./services/alarmService');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const categoryRoutes = require('./routes/categories');
const commentRoutes = require('./routes/comments');
const analyticsRoutes = require('./routes/analytics');
const quoteRoutes = require('./routes/quotes');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const calendarRoutes = require('./routes/calendar');
const chatRoutes = require('./routes/chat');
const { router: focusRoutes } = require('./routes/focus');
const alarmRoutes = require('./routes/alarms');

// Import middleware and utilities
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const createDirectories = require('./utils/createDirectories');
const { initWebSocket } = require('./websocket');

const app = express();
const server = http.createServer(app);

// Create required directories (uploads etc)
createDirectories();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Allowed origins (dev defaults)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://localhost:5175'
];

// Simple CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ---------- STATIC FILES: UPLOADS ----------
const uploadsDir = path.join(__dirname, 'uploads');

app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  console.log(`[UPLOADS] ${req.method} ${req.originalUrl} - from origin: ${origin || 'unknown'}`);
  next();
}, express.static(uploadsDir));

app.use('/api/v1/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  console.log(`[API_UPLOADS] ${req.method} ${req.originalUrl} - from origin: ${origin || 'unknown'}`);
  next();
}, express.static(uploadsDir));

// Covers upload
app.use('/uploads/covers', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  console.log(`[COVERS] ${req.method} ${req.originalUrl} - from origin: ${origin || 'unknown'}`);
  next();
}, express.static(path.join(__dirname, 'uploads', 'covers')));

app.use('/api/v1/uploads/covers', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  console.log(`[API_COVERS] ${req.method} ${req.originalUrl} - from origin: ${origin || 'unknown'}`);
  next();
}, express.static(path.join(__dirname, 'uploads', 'covers')));

// ---------- WEBSOCKET ----------
let io;
try {
  console.log('Initializing WebSocket server...');
  io = initWebSocket(server);
  app.set('io', io);
  console.log('✅ WebSocket server initialized successfully');
} catch (error) {
  console.error('❌ WebSocket initialization failed:', error.message);
  console.log('⚠️ Continuing without WebSocket functionality');
  io = { on: () => {}, emit: () => {} };
  app.set('io', io);
}

// Initialize services with WebSocket
notificationService.setIO(io);
alarmService.startScheduler(io);
console.log('✅ All services initialized with WebSocket');

// ---------- DATABASE ----------
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  logger.info('Connected to MongoDB');

  const { startMotivationScheduler } = require('./services/motivationService');
  const { generateRecurringTasks } = require('./services/recurringTaskService');

  startMotivationScheduler(io);
  generateRecurringTasks();

  console.log('✅ All background services started successfully');
})
.catch(err => {
  logger.error('MongoDB connection error:', err);
  process.exit(1);
});

// ---------- ROUTES ----------
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/alarms', alarmRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/quotes', quoteRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/focus', focusRoutes);
app.use('/api/v1/chat', chatRoutes);

// Health check
app.get('/api/v1/alarms/health', (req, res) => {
  const status = alarmService.getStatus();
  res.json({
    status: 'OK',
    alarmService: status,
    timestamp: new Date().toISOString()
  });
});

// ---------- ERROR HANDLER ----------
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Check port availability
const checkPort = (port) => {
  return new Promise((resolve) => {
    const testServer = http.createServer();
    testServer.listen(port, () => {
      testServer.close();
      resolve(true);
    });
    testServer.on('error', () => {
      resolve(false);
    });
  });
};

// Start server
const startServer = async () => {
  const isPortAvailable = await checkPort(PORT);

  if (!isPortAvailable) {
    console.log(`⚠️ Port ${PORT} is already in use. Trying alternative port...`);

    const alternativePorts = [5001, 5002, 5003, 5004, 5005];
    let availablePort = null;

    for (const port of alternativePorts) {
      if (await checkPort(port)) {
        availablePort = port;
        break;
      }
    }

    if (!availablePort) {
      console.error('❌ No available ports found. Please free up a port and try again.');
      process.exit(1);
    }

    console.log(`✅ Using alternative port: ${availablePort}`);
    server.listen(availablePort, () => {
      logger.info(`Server running on port ${availablePort}`);
      console.log(`Server is running on http://localhost:${availablePort}`);
    });
  } else {
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  }
};

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please free the port or use a different one.`);
    console.log('You can:');
    console.log('1. Kill the process using the port:');
    console.log('   Windows: netstat -ano | findstr :5000 && taskkill /PID <PID> /F');
    console.log('   Linux/Mac: lsof -i :5000 && kill -9 <PID>');
    console.log('2. Use a different port by setting PORT environment variable');
    console.log('   Example: PORT=5001 npm run dev');
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

startServer();







