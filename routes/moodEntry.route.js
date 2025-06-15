const express = require("express");
const User = require("../models/User.model");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/authHandler");
const Team = require("../models/Team.model");
const MoodEntry = require("../models/MoodEntry.model");
const { default: mongoose } = require("mongoose");

//! Entries are create+read only

//GET ALL
router.get(
  "/api/moodentries",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    try {
      const companyId = req.payload.company;
      const entries = await MoodEntry.find({ company: companyId }).populate(
        "createdBy",
        "-password"
      );
      res.json(entries);
    } catch (error) {
      next(error);
    }
  }
);

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
      const entries = await MoodEntry.find({
        createdBy: userId,
      }).populate("createdBy", "-password");
      console.log("Querying MoodEntry with:", {
        createdBy: userId,
      });
      console.log("Found entries:", entries.length);
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
      const companyId = req.payload.company;
      console.log("compayn id", companyId);
      if (!date) return res.status(400).json({ message: "Date is required." });
      const entryDate = new Date(date);
      if (isNaN(entryDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format." });
      }

      const entry = await MoodEntry.findOne({
        createdBy: userId,
        date: entryDate,
        company: companyId,
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
      const companyId = req.payload.company;
      // Find users in the team and company
      const users = await User.find({ team: id, company: companyId }).select(
        "_id"
      );
      const userIds = users.map((u) => u._id);
      //Find entries by those users and company
      const entries = await MoodEntry.find({
        createdBy: { $in: userIds },
        company: companyId,
      }).populate({
        path: "createdBy",
        select: "-password",
      });
      res.json(entries.filter((e) => e.createdBy));
    } catch (error) {
      next(error);
    }
  }
);

// GET today's mood entries for the requesting user's team
// Ensure frontend sends queryparam with local today date
router.get(
  "/api/moodentries/today",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { date } = req.query;
      const companyId = req.payload.company;
      console.log("companyid: ", companyId);
      if (!date) return res.status(400).json({ message: "Date is required." });
      const entryDate = new Date(date);
      if (isNaN(entryDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format." });
      }

      const user = await User.findById(req.payload._id);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!user.team) {
        return res
          .status(400)
          .json({ message: "User is not assigned to a team." });
      }

      const teamUsers = await User.find({
        team: user.team,
        company: companyId,
      }).select("_id");
      const userIds = teamUsers.map((u) => u._id);
      const entries = await MoodEntry.find({
        createdBy: { $in: userIds },
        date: entryDate,
        company: companyId,
      }).populate("createdBy", "-password");

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
    const companyId = req.payload.company;

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
      company: companyId,
    });
    res.status(201).json(newEntry);
  } catch (error) {
    next(error);
  }
});

//GET BY ENTRY ID
router.get("/api/moodentries/:id", isAuthenticated, async (req, res, next) => {
  try {
    const companyId = req.payload.company;
    const entry = await MoodEntry.findOne({
      _id: req.params.id,
      company: companyId,
    }).populate("createdBy", "-password");
    if (!entry)
      return res.status(404).json({ message: "Mood entry not found" });
    res.json(entry);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
