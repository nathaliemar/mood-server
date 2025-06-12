const express = require("express");
const User = require("../models/User.model");
const router = express.Router();
const { isAuthenticated } = require("../middleware/authHandler");
const Team = require("../models/Team.model");
const MoodEntry = require("../models/MoodEntry.model");
const { default: mongoose } = require("mongoose");

//! Entries are create+read only

//GET ALL
router.get("/api/moodentries", isAuthenticated, async (req, res, next) => {
  try {
    const entries = await MoodEntry.find().populate("createdBy", "-password");
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

//GET ALL FOR A SPECIFIC USER
router.get(
  "/api/moodentries/user/:userId",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user id" });
      }
      const entries = await MoodEntry.find({ createdBy: userId }).populate(
        "createdBy",
        "-password"
      );
      res.json(entries);
    } catch (error) {
      next(error);
    }
  }
);

//GET TODAY'S ENTRY FOR A SPECIFIC USER
//Todo: Ensure frontend sends today's date as queryparam (in addition to userid)
router.get(
  "/api/moodentries/user/:userId/today",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { date } = req.query;
      if (!date) return res.status(400).json({ message: "Date is required." });
      const entryDate = new Date(date);
      if (isNaN(entryDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format." });
      }

      const entry = await MoodEntry.findOne({
        createdBy: userId,
        date: entryDate,
      }).populate("createdBy", "-password");

      if (!entry) {
        return res
          .status(404)
          .json({ message: "No mood entry for this date." });
      }

      res.json(entry);
    } catch (error) {
      next(error);
    }
  }
);

//GET BY TEAM
router.get(
  "/api/moodentries/team/:id",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const entries = await MoodEntry.find().populate({
        path: "createdBy",
        match: { team: id },
        select: "-password",
      });
      // Filter out entries where createdBy is null (not in this team)
      res.json(entries.filter((e) => e.createdBy));
    } catch (error) {
      next(error);
    }
  }
);

// GET today's mood entries for the requesting user's team (user) or everyone (admin)
//TODO: Ensure frontend sends queryparam with local today date
router.get(
  "/api/moodentries/today",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { date } = req.query;
      if (!date) return res.status(400).json({ message: "Date is required." });
      const entryDate = new Date(date); //parse date to be JS date object
      if (isNaN(entryDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format." });
      }

      const user = await User.findById(req.payload._id);
      if (!user) return res.status(404).json({ message: "User not found" });

      let entries;
      if (user.role === "admin") {
        entries = await MoodEntry.find({ date: entryDate }).populate(
          "createdBy",
          "-password"
        );
      } else if (user.team) {
        const teamUsers = await User.find({ team: user.team }).select("_id");
        const userIds = teamUsers.map((u) => u._id);
        entries = await MoodEntry.find({
          createdBy: { $in: userIds },
          date: entryDate,
        }).populate("createdBy", "-password");
      } else {
        return res
          .status(400)
          .json({ message: "User is not assigned to a team." });
      }

      res.json(entries);
    } catch (error) {
      next(error);
    }
  }
);

//POST
router.post("/api/moodentries", isAuthenticated, async (req, res, next) => {
  try {
    const { score, note, date } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    const entryDate = new Date(date);
    if (isNaN(entryDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    // Prevent duplicate entry for this date
    const existing = await MoodEntry.findOne({
      createdBy: req.payload._id,
      date: entryDate,
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Mood entry for this date already exists" });
    }

    const newEntry = await MoodEntry.create({
      createdBy: req.payload._id,
      score,
      note,
      date: entryDate,
    });
    res.status(201).json(newEntry);
  } catch (error) {
    next(error);
  }
});

//GET BY ENTRY ID

router.get("/api/moodentries/:id", isAuthenticated, async (req, res, next) => {
  try {
    const entry = await MoodEntry.findById(req.params.id).populate(
      "createdBy",
      "-password"
    );
    if (!entry)
      return res.status(404).json({ message: "Mood entry not found" });
    res.json(entry);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
