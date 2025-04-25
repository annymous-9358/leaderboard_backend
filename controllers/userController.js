const User = require("../models/User");
const Activity = require("../models/Activity");
const moment = require("moment");
const mongoose = require("mongoose");

// Get all users with their total points and ranks
exports.getLeaderboard = async (req, res) => {
  try {
    const { filter, userId, simpleId } = req.query;
    let query = {};

    // If a specific user ID is provided (either MongoDB ID or simpleId)
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        success: true,
        data: [user],
      });
    } else if (simpleId) {
      const user = await User.findOne({ simpleId: parseInt(simpleId) });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        success: true,
        data: [user],
      });
    }

    // Get all users sorted by total points in descending order
    const users = await User.find(query).sort({ totalPoints: -1 });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Search for a specific user by ID or simpleId
exports.searchUser = async (req, res) => {
  try {
    const { userId } = req.params;
    let user;

    // First try to parse as a simple ID number
    const simpleIdNum = parseInt(userId);
    if (!isNaN(simpleIdNum)) {
      user = await User.findOne({ simpleId: simpleIdNum });
    }

    // If not found by simpleId, try by MongoDB ObjectId
    if (!user && mongoose.isValidObjectId(userId)) {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get all other users sorted by total points
    const otherUsers = await User.find({ _id: { $ne: user._id } }).sort({
      totalPoints: -1,
    });

    // Combine the searched user with the rest of the leaderboard
    const combinedResults = [user, ...otherUsers];

    return res.status(200).json({
      success: true,
      data: combinedResults,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Filter leaderboard by time period
exports.filterLeaderboard = async (req, res) => {
  try {
    const { filter } = req.params;

    let startDate;
    const now = moment();

    // Determine the start date based on the filter
    if (filter === "day") {
      startDate = now.startOf("day");
    } else if (filter === "month") {
      startDate = now.startOf("month");
    } else if (filter === "year") {
      startDate = now.startOf("year");
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid filter parameter. Use "day", "month", or "year".',
      });
    }

    // Find activities within the time period
    const activities = await Activity.find({
      activityDate: { $gte: startDate.toDate() },
    }).populate("user");

    // Get a map of all users to ensure we have simpleId for each user
    const allUsers = await User.find({});
    const userMap = {};
    allUsers.forEach((user) => {
      userMap[user._id.toString()] = {
        _id: user._id,
        fullName: user.fullName,
        simpleId: user.simpleId,
        totalPoints: 0,
        rank: 0,
      };
    });

    // Aggregate user points for the time period
    activities.forEach((activity) => {
      const userId = activity.user._id.toString();
      if (userMap[userId]) {
        userMap[userId].totalPoints += activity.points;
      }
    });

    // Convert to array, filter out users with 0 points, and sort
    let filteredUsers = Object.values(userMap)
      .filter((user) => user.totalPoints > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints);

    // Assign ranks
    let currentRank = 1;
    let previousPoints = -1;

    filteredUsers = filteredUsers.map((user) => {
      if (previousPoints !== -1 && previousPoints !== user.totalPoints) {
        currentRank++;
      }
      user.rank = currentRank;
      previousPoints = user.totalPoints;
      return user;
    });

    return res.status(200).json({
      success: true,
      data: filteredUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Recalculate ranks for all users
exports.recalculateRanks = async (req, res) => {
  try {
    // Get all users sorted by points
    const users = await User.find({}).sort({ totalPoints: -1 });

    // Assign ranks
    let currentRank = 1;
    let previousPoints = -1;

    // Update each user with the new rank
    for (const user of users) {
      if (previousPoints !== -1 && previousPoints !== user.totalPoints) {
        currentRank++;
      }

      user.rank = currentRank;
      await user.save();

      previousPoints = user.totalPoints;
    }

    // Return updated leaderboard
    const updatedUsers = await User.find({}).sort({ totalPoints: -1 });

    return res.status(200).json({
      success: true,
      message: "Ranks recalculated successfully",
      data: updatedUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
