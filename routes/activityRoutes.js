const express = require("express");
const router = express.Router();
const {
  createActivity,
  getAllActivities,
  getUserActivities,
} = require("../controllers/activityController");

// @route POST /api/activities
// @desc Create a new activity
router.post("/", createActivity);

// @route GET /api/activities
// @desc Get all activities
router.get("/", getAllActivities);

// @route GET /api/activities/user/:userId
// @desc Get activities by user ID
router.get("/user/:userId", getUserActivities);

module.exports = router;
