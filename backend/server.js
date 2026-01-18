// ============================================
// BACKEND API SERVER - Tea Management System
// REFACTORED TO USE src/ STRUCTURE
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Import from src/
const { prisma, pool } = require('./src/lib/prisma');
const { startOrderHistoryCleaner } = require('./src/jobs/orderHistoryCleaner');

const app = express();
const httpServer = createServer(app);

// ============================================
// SOCKET.IO SETUP
// ============================================

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.on('join-kitchen', (kitchenId) => {
    socket.join(`kitchen-${kitchenId}`);
    console.log(`🔔 Socket ${socket.id} joined kitchen-${kitchenId}`);
  });

  socket.on('join-room', (roomId) => {
    socket.join(`room-${roomId}`);
    console.log(`🔔 Socket ${socket.id} joined room-${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Make io available to routes via app.locals
app.locals.io = io;

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// API ROUTES
// ============================================

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const tenantRoutes = require('./src/routes/tenant.routes');
const activationRoutes = require('./src/routes/activation.routes');
const kitchenRoutes = require('./src/routes/kitchen.routes');
const roomRoutes = require('./src/routes/room.routes');
const menuRoutes = require('./src/routes/menu.routes');
const orderRoutes = require('./src/routes/order.routes');
const superAdminRoutes = require('./routes/super-admin.routes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/activation', activationRoutes);
app.use('/api/kitchens', kitchenRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/room', roomRoutes); // Alias for room login
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/super-admin', superAdminRoutes);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Tea Management System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((error, _req, res, _next) => {
  console.error('❌ Server Error:', error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log('');
  console.log('====================================');
  console.log('🚀 Tea Management System API');
  console.log('====================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.IO: Enabled`);
  console.log('====================================');
  console.log('');

  // Start background jobs
  startOrderHistoryCleaner();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  httpServer.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  });
});

module.exports = { app, httpServer, io };
