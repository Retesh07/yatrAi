const mongoose = require('mongoose');

// A single timed stop within a day
const eventSchema = new mongoose.Schema({
  time: { type: String, required: true },
  title: { type: String, required: true },
  desc: { type: String, required: true },
  icon: { type: String },
}, { _id: false });

const daySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  events: [eventSchema],
}, { _id: false });

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pricePerNight: { type: String, required: true },
  rating: { type: String },
  area: { type: String },
}, { _id: false });

const tripSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  ownerName: {
    type: String,
    trim: true,
    default: '',
  },
  fromLocation: { type: String, default: 'Delhi' },
  destination: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  people: { type: String },
  budget: { type: String },
  travelStyle: [{ type: String }],
  food: { type: String },
  transport: [{ type: String }],
  days: [daySchema],
  recommendedHotels: [hotelSchema],
  estimatedCost: { type: String },
  status: {
    type: String,
    enum: ['draft', 'generating', 'completed', 'failed'],
    default: 'draft',
  },
  isPublic: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
