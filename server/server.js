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

// Dynamic CORS helper: allows CLIENT_URL, local dev, and all Vercel preview domains (*.vercel.app)
const clientUrlClean = (process.env.CLIENT_URL || '').replace(/\/$/, '');

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow server-to-server, Postman, curl
  if (clientUrlClean && origin === clientUrlClean) return true;
  if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return true;
  if (/\.vercel\.app$/.test(origin)) return true; // allow any Vercel domain automatically
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS error: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
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
