const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false  // never return password in queries
  },
  googleId: {
    type: String,
    default: null
  },
  preferences: {
    food: {
      type: String,
      enum: ['veg', 'non-veg', 'vegan', 'jain'],
      default: 'veg'
    },
    travelStyle: {
      type: String,
      enum: ['budget', 'moderate', 'comfort', 'luxury'],
      default: 'moderate'
    },
    transport: {
      type: String,
      enum: ['train', 'bus', 'flight', 'road', 'mix'],
      default: 'mix'
    }
  },
  refreshToken: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to compare passwords at login
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);