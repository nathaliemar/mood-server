const express = require("express");
const User = require("../models/User.model");
const router = express.Router();
const { isAuthenticated } = require("../middleware/authHandler");
const Team = require("../models/Team.model");
const MoodEntry = require("../models/MoodEntry.model");
const mongoose = require("mongoose");

//GET ALL
router.get("/api/users", async (req, res, next) => {
  try {
    const users = await User.find({}).select("-password").populate("team");
    console.log("Retrieved users", users);
    res.json(users);
  } catch (error) {
    next(error);
  }
});

//GET BY ID
router.get("/api/users/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    // Check if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    const user = await User.findById(id).select("-password").populate("team");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("Retrieved user", user);
    res.json(user);
  } catch (error) {
    next(error);
  }
});
//PUT
router.put("/api/users/:id", async (req, res, next) => {
  const { id } = req.params;
  const { team, ...userData } = req.body;
  try {
    // Find the current user
    const user = await User.findById(id);

    // Block removal of team without replacement if user already has a team
    if (user.team && (!team || team === "")) {
      return res.status(400).json({
        message: "Cannot remove team without providing a replacement.",
      });
    }
    // Update the user document (including the new team if provided)
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { ...userData, team: team || null },
      { new: true }
    ).select("-password");

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

//DELETE
//Referential integrity:
//TEAMS
//if user was teamlead, remove the user as lead from the team model
//MOODENTRIES
//remove "createdby"
router.delete("/api/users/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    //Before deleting the user, remove them from teamLeads arrays
    await Team.updateMany({ teamLeads: id }, { $pull: { teamLeads: id } });
    //TODO: Frontend: if (!team.createdBy) displayName="Deleted User"
    await Team.updateMany({ createdBy: id }, { $set: { createdBy: null } });

    //TODO: Frontend: Filter out responses createdBy "null"
    //Before deleting, set author of moodEntries to null
    await MoodEntry.updateMany(
      { createdBy: id },
      { $set: { createdBy: null } }
    );
    //Delete user
    await User.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
