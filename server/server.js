const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { initSocket } = require('./services/socketService');
const { initQueue } = require('./services/queueService');
const { startTripReminderScheduler } = require('./services/tripNotificationService');

// Load env variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'YatrAI API is running 🚀' });
});

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/trips', require('./routes/trips'));
app.use('/api/v1/notifications', require('./routes/notifications'));
const { protect } = require('./middleware/authMiddleware');

app.get('/api/v1/protected', protect, (req, res) => {
  res.json({
    success: true,
    message: `Hello ${req.user.name}, you are authorized!`
  });
});

// Initialize real-time and queue services
initSocket(server);
initQueue();
startTripReminderScheduler();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
