require('dotenv').config();

const mongoose = require('mongoose');
const Trip = require('../models/Trip');
require('../models/User');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const trips = await Trip.find({ isPublic: true }).populate('user', 'name');
  let updated = 0;

  for (const trip of trips) {
    const userName = trip.user && trip.user.name ? String(trip.user.name).trim() : '';
    const currentOwnerName = String(trip.ownerName || '').trim();
    const shouldReplace =
      !currentOwnerName ||
      /^(traveler|a traveler)$/i.test(currentOwnerName) ||
      currentOwnerName !== userName;

    if (!userName || !shouldReplace) continue;

    trip.ownerName = userName;
    await trip.save();
    updated += 1;
  }

  console.log(JSON.stringify({ matched: trips.length, updated }));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
