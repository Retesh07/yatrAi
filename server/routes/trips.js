const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createTrip,
  generateTripItinerary,
  getMyTrips,
  getPublicTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} = require('../controllers/tripController');

router.post('/', protect, createTrip);
router.post('/:id/generate', protect, generateTripItinerary);
router.get('/', protect, getMyTrips);
router.get('/public', getPublicTrips);
router.get('/:id', protect, getTripById);
router.put('/:id', protect, updateTrip);
router.delete('/:id', protect, deleteTrip);

module.exports = router;
