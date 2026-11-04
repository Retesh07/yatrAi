/**
 * Node.js utility to safely clean up all load-testing data from MongoDB
 * Run via: node performance/helpers/dataCleanup.js
 */
const path = require('path');

// Resolve packages from server/node_modules
const serverModules = path.join(__dirname, '../../server/node_modules');
const mongoose = require(path.join(serverModules, 'mongoose'));
const dotenv = require(path.join(serverModules, 'dotenv'));

dotenv.config({ path: path.join(__dirname, '../../server/.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yatrai';

async function cleanupTestData() {
  console.log('Connecting to database for test data cleanup...');
  await mongoose.connect(MONGO_URI);

  try {
    const User = mongoose.model(
      'User',
      new mongoose.Schema({}, { strict: false }),
      'users'
    );
    const Trip = mongoose.model(
      'Trip',
      new mongoose.Schema({}, { strict: false }),
      'trips'
    );
    const Notification = mongoose.model(
      'Notification',
      new mongoose.Schema({}, { strict: false }),
      'notifications'
    );

    // Delete users with perf_test prefix
    const testUsers = await User.find({ email: /perf_test_user_/ });
    const userIds = testUsers.map((u) => u._id);

    console.log(`Found ${testUsers.length} load-test users to clean up.`);

    if (userIds.length > 0) {
      const tripsDeleted = await Trip.deleteMany({ user: { $in: userIds } });
      const notifsDeleted = await Notification.deleteMany({ user: { $in: userIds } });
      const usersDeleted = await User.deleteMany({ _id: { $in: userIds } });

      console.log(`Cleaned up:
  - ${usersDeleted.deletedCount} test users
  - ${tripsDeleted.deletedCount} test trips
  - ${notifsDeleted.deletedCount} notifications`);
    }

    console.log('Test data cleanup completed safely. ✅');
  } catch (error) {
    console.error('Cleanup failed:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

if (require.main === module) {
  cleanupTestData();
}

module.exports = { cleanupTestData };

