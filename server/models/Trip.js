const mongoose = require('mongoose');

// A single timed stop within a day
const eventSchema = new mongoose.Schema({
  time: { type: String },
  title: { type: String },
  desc: { type: String },
  description: { type: String },
  location: { type: String },
  duration: { type: String },
  estimatedCost: { type: mongoose.Schema.Types.Mixed },
  category: { type: String },
  icon: { type: String },
}, { _id: false });

const daySchema = new mongoose.Schema({
  day: { type: Number },
  date: { type: String },
  title: { type: String },
  theme: { type: String },
  estimatedDailyExpense: { type: mongoose.Schema.Types.Mixed },
  travelTip: { type: String },
  events: [eventSchema],
}, { _id: false });

const hotelSchema = new mongoose.Schema({
  name: { type: String },
  category: { type: String },
  pricePerNight: { type: mongoose.Schema.Types.Mixed },
  rating: { type: mongoose.Schema.Types.Mixed },
  area: { type: String },
  amenities: [{ type: String }],
  pros: [{ type: String }],
  whyRecommended: { type: String },
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
  hotels: [hotelSchema],
  restaurants: [{ type: mongoose.Schema.Types.Mixed }],
  estimatedCost: { type: String },
  transitOptions: { type: mongoose.Schema.Types.Mixed },
  budgetBreakdown: { type: mongoose.Schema.Types.Mixed },
  tripSummary: { type: mongoose.Schema.Types.Mixed },
  mustVisitPlaces: [{ type: mongoose.Schema.Types.Mixed }],
  packingChecklist: [{ type: mongoose.Schema.Types.Mixed }],
  shoppingRecommendations: [{ type: mongoose.Schema.Types.Mixed }],
  essentialTips: [{ type: mongoose.Schema.Types.Mixed }],
  emergencyInformation: { type: mongoose.Schema.Types.Mixed },
  tripStatistics: { type: mongoose.Schema.Types.Mixed },
  status: {
    type: String,
    enum: ['draft', 'generating', 'completed', 'failed'],
    default: 'draft',
  },
  isPublic: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
