# YatrAI 🗺️

> Your next Indian adventure, planned by AI.

YatrAI is a full stack AI trip planner built exclusively 
for Indian travelers. Answer 7 quick questions and get a 
complete day-by-day itinerary in seconds.

## Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, React Router  
**Backend:** Node.js, Express, MongoDB, Mongoose  
**Auth:** JWT, Refresh Tokens, Google OAuth  
**AI:** Claude API with streaming responses  
**Real-time:** Socket.io  
**Queue:** BullMQ + Redis (Upstash)  
**Deploy:** Render + MongoDB Atlas  

## Features

- 🧭 7-step trip wizard (destination, dates, budget, style)
- 🤖 AI itinerary generation with live streaming
- 🗺️ Interactive Google Maps with trip stops
- 🌤️ Weather forecasts for trip dates
- 👥 Community trip sharing and copying
- 🔐 JWT auth with refresh token rotation
- 📬 Email itinerary PDF via background jobs
- 🔴 Live notifications via WebSockets
- 🌙 Dark mode with system preference detection

## India-Specific

- Budget always in ₹ rupees
- Indian transport — Train, Bus, Road Trip, Flight
- Veg / Non-veg / Vegan / Jain food filters
- Festival & season-aware suggestions
- Local tips tourists usually miss

## Getting Started

### Backend
cd server
npm install
npm run dev

### Frontend
cd client
npm install
npm run dev

## Environment Variables

Create server/.env:
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
