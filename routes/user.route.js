const express = require("express");
const User = require("../models/User.model");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/authHandler");
const Team = require("../models/Team.model");
const MoodEntry = require("../models/MoodEntry.model");
const mongoose = require("mongoose");

//GET ALL
router.get("/api/users", isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const companyId = req.payload.company;
    const users = await User.find({ company: companyId })
      .select("-password")
      .populate("team");
    console.log("Retrieved users", users);
    res.json(users);
  } catch (error) {
    next(error);
  }
});

//GET BY ID
router.get(
  "/api/users/:id",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    const { id } = req.params;
    try {
      // Check if id is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      const companyId = req.payload.company;
      const user = await User.findOne({ _id: id, company: companyId })
        .select("-password")
        .populate("team");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log("Retrieved user", user);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);
//PUT
router.put(
  "/api/users/:id",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    const { id } = req.params;
    const { team, ...userData } = req.body;
    try {
      const companyId = req.payload.company;
      // Find the current user, but only if they belong to the same company
      const user = await User.findOne({ _id: id, company: companyId });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Block removal of team without replacement if user already has a team
      if (user.team && (!team || team === "")) {
        return res.status(400).json({
          message: "Cannot remove team without providing a replacement.",
        });
      }
      //Block assigning teamLead without team assigned
      if (
        (userData.isTeamlead === true || userData.isTeamlead === "true") && // being set to true
        (!team || team === "")
      ) {
        return res.status(400).json({
          message: "Please assign a team before making a user team lead",
        });
      }
      // Update the user document (including the new team if provided)
      const updatedUser = await User.findOneAndUpdate(
        { _id: id, company: companyId },
        { ...userData, team: team || null },
        { new: true }
      ).select("-password");

      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  }
);

//DELETE
//Referential integrity
router.delete(
  "/api/users/:id",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    const { id } = req.params;
    try {
      const companyId = req.payload.company;
      // Block self-deletion
      if (req.payload._id === id) {
        return res
          .status(400)
          .json({ message: "You cannot delete your own user account." });
      }
      // Only delete if user belongs to the same company
      const user = await User.findOne({ _id: id, company: companyId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      //Before deleting the user, remove them from createdby of teams
      await Team.updateMany(
        { createdBy: id, company: companyId },
        { $set: { createdBy: null } }
      );

      await MoodEntry.deleteMany({ createdBy: id, company: companyId });
      //Delete user
      await User.findByIdAndDelete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
