const express = require("express");
const Team = require("../models/Team.model");
const { isAuthenticated } = require("../middleware/authHandler");
const router = express.Router();
const User = require("../models/User.model");

//GET all teams
router.get("/api/teams", async (req, res, next) => {
  try {
    const teams = await Team.find();
    console.log("Retrieved teams", teams);
    res.json(teams);
  } catch (error) {
    next(error);
  }
});

//GET team by ID
router.get("/api/teams/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }
    console.log("Team retrieved", team);
    res.json(team);
  } catch (error) {
    next(error);
  }
});

//POST team
router.post("/api/teams", isAuthenticated, async (req, res, next) => {
  if (req.body.teamName === "") {
    res.status(400).json({ message: "Provide a team name." });
    return;
  }
  try {
    const newTeam = await Team.create({
      //FYI: team leads remains empty, can only be set in "put"
      teamName: req.body.teamName,
      createdBy: req.payload._id,
      company: req.payload.company,
    });
    res.status(201).json(newTeam);
  } catch (error) {
    // Handle duplicate team name error individually
    if (error.code === 11000 && error.keyPattern && error.keyPattern.teamName) {
      return res.status(409).json({ message: "Team name already exists." });
    }
    next(error);
  }
});

//PUT (update name, leads)
//!Memberships can only be assigned via user route
router.put("/api/teams/:id", async (req, res, next) => {
  const { id } = req.params;
  // Only allow updating teamName and teamLeads (or whatever your field is called)
  const { teamName, teamLeads } = req.body;

  // Build the update object
  const updateData = {};
  if (teamName !== undefined) updateData.teamName = teamName;
  if (teamLeads !== undefined) updateData.teamLeads = teamLeads;

  try {
    const updatedTeam = await Team.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedTeam) {
      return res.status(404).json({ message: "Team not found." });
    }
    res.json(updatedTeam);
  } catch (error) {
    next(error);
  }
});

//DELETE
//! Can only be done if no users assigned
router.delete("/api/teams/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    // Find users assigned to this team
    const usersWithTeam = await User.find({ team: id });

    if (usersWithTeam.length) {
      // There are users assigned to this team, return arr of obj containing these users to make it easy for admin
      return res.status(409).json({
        message: "Cannot delete team while users are assigned.",
        users: usersWithTeam.map((u) => ({
          id: u._id,
          name: u.name,
          email: u.email,
        })),
      });
    }

    // No users assigned, safe to delete
    const deletedTeam = await Team.findByIdAndDelete(id);
    if (!deletedTeam) {
      return res.status(404).json({ message: "Team not found." });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
