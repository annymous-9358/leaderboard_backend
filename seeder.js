const mongoose = require("mongoose");
const User = require("./models/User");
const Activity = require("./models/Activity");
const connectDB = require("./config/db");
const moment = require("moment");
require("dotenv").config();

// Connect to database
connectDB();

// Sample user data
const users = [
  { fullName: "John Doe", simpleId: 1 },
  { fullName: "Jane Smith", simpleId: 2 },
  { fullName: "Michael Johnson", simpleId: 3 },
  { fullName: "Sarah Williams", simpleId: 4 },
  { fullName: "David Brown", simpleId: 5 },
  { fullName: "Emily Davis", simpleId: 6 },
  { fullName: "Robert Wilson", simpleId: 7 },
  { fullName: "Jennifer Taylor", simpleId: 8 },
  { fullName: "Thomas Anderson", simpleId: 9 },
  { fullName: "Lisa Martinez", simpleId: 10 },
];

// Function to generate random activities
const generateActivities = (users) => {
  const activities = [];
  const now = moment();
  const daysInPast = 60; // Generate activities for the past 60 days

  // For each user
  users.forEach((user) => {
    // Generate random number of activities for each day
    for (let day = 0; day < daysInPast; day++) {
      const date = moment(now).subtract(day, "days");

      // Random number of activities per day (0-5)
      const activitiesPerDay = Math.floor(Math.random() * 6);

      for (let i = 0; i < activitiesPerDay; i++) {
        // Random hour of the day
        const hour = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
        date.hour(hour);

        activities.push({
          user: user._id,
          points: 20, // Always 20 points as per requirement
          activityDate: date.toDate(),
        });
      }
    }
  });

  return activities;
};

// Function to update user points and ranks
const updateUserPointsAndRanks = async (users) => {
  // Calculate total points for each user
  for (const user of users) {
    const activities = await Activity.find({ user: user._id });
    const totalPoints = activities.reduce(
      (sum, activity) => sum + activity.points,
      0
    );

    user.totalPoints = totalPoints;
    await user.save();
  }

  // Sort users by total points and assign ranks
  const sortedUsers = await User.find().sort({ totalPoints: -1 });

  let currentRank = 1;
  let previousPoints = -1;

  for (const user of sortedUsers) {
    if (previousPoints !== -1 && previousPoints !== user.totalPoints) {
      currentRank++;
    }

    user.rank = currentRank;
    await user.save();

    previousPoints = user.totalPoints;
  }
};

// Seed data
const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Activity.deleteMany({});

    console.log("Data cleared...");

    // Insert users
    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} users created`);

    // Insert activities
    const activities = generateActivities(createdUsers);
    await Activity.insertMany(activities);
    console.log(`${activities.length} activities created`);

    // Update user points and ranks
    await updateUserPointsAndRanks(createdUsers);
    console.log("User points and ranks updated");

    console.log("Data seeded successfully!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
