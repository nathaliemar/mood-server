const express = require("express");
const Team = require("../models/Team.model");
const { isAuthenticated } = require("../middleware/authHandler");
const router = express.Router();
const User = require("../models/User.model");

//GET all teams
router.get("/api/teams", isAuthenticated, async (req, res, next) => {
  try {
    const companyId = req.payload.company;
    const teams = await Team.find({ company: companyId });
    console.log("Retrieved teams", teams);
    res.json(teams);
  } catch (error) {
    next(error);
  }
});

//GET team by ID
router.get("/api/teams/:id", isAuthenticated, async (req, res, next) => {
  const { id } = req.params;
  try {
    const companyId = req.payload.company;
    const team = await Team.findOne({ _id: id, company: companyId });
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
  if (!req.body.teamName) {
    res.status(400).json({ message: "Please provide a valid team name." });
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

//PUT (update name)
//!Memberships can only be assigned via user route
router.put("/api/teams/:id", isAuthenticated, async (req, res, next) => {
  const { id } = req.params;
  const { teamName } = req.body;
  const companyId = req.payload.company;

  // Build the update object
  const updateData = {};
  if (teamName !== undefined) {
    if (!teamName) {
      return res
        .status(400)
        .json({ message: "Please provide a valid team name." });
    }
    updateData.teamName = teamName;
  }
  try {
    // Check for duplicate team name (excluding current team) within the same company
    if (teamName) {
      const existingTeam = await Team.findOne({
        teamName,
        _id: { $ne: id },
        company: companyId,
      });
      if (existingTeam) {
        return res.status(409).json({ message: "Team name already exists." });
      }
    }
    const updatedTeam = await Team.findOneAndUpdate(
      { _id: id, company: companyId },
      updateData,
      { new: true }
    );
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
router.delete("/api/teams/:id", isAuthenticated, async (req, res, next) => {
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
