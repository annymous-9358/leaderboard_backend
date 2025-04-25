const express = require("express");
const router = express.Router();
const {
  getLeaderboard,
  searchUser,
  filterLeaderboard,
  recalculateRanks,
} = require("../controllers/userController");

// @route GET /api/users
// @desc Get leaderboard of all users sorted by points
router.get("/", getLeaderboard);

// @route GET /api/users/search/:userId
// @desc Search for a specific user by ID
router.get("/search/:userId", searchUser);

// @route GET /api/users/filter/:filter
// @desc Filter leaderboard by day, month, or year
router.get("/filter/:filter", filterLeaderboard);

// @route POST /api/users/recalculate
// @desc Recalculate ranks for all users
router.post("/recalculate", recalculateRanks);

module.exports = router;
