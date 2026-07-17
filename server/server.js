const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Load env variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

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
const { protect } = require('./middleware/authMiddleware');

app.get('/api/v1/protected', protect, (req, res) => {
  res.json({
    success: true,
    message: `Hello ${req.user.name}, you are authorized!`
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

