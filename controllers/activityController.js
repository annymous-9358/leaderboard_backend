const Activity = require("../models/Activity");
const User = require("../models/User");

// Create a new activity
exports.createActivity = async (req, res) => {
  try {
    const { userId, simpleId } = req.body;

    // Check if user exists - try by MongoDB ID first, then by simpleId if provided
    let user;

    if (userId) {
      user = await User.findById(userId);
    } else if (simpleId) {
      user = await User.findOne({ simpleId });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create new activity
    const activity = new Activity({
      user: user._id,
      points: 20, // Fixed value as per requirements
    });

    await activity.save();

    // Update user's total points
    user.totalPoints += 20;
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Activity recorded successfully",
      data: activity,
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

// Get all activities
exports.getAllActivities = async (req, res) => {
  try {
    const activities = await Activity.find({})
      .populate("user", "fullName")
      .sort({ activityDate: -1 });

    return res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
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

// Get activities by user ID
exports.getUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const activities = await Activity.find({ user: userId }).sort({
      activityDate: -1,
    });

    return res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
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
