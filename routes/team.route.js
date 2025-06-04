const express = require("express");
const Team = require("../models/Team.model");
const router = express.Router();

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
    console.log("Team retrieved", team);
    res.json(team);
  } catch (error) {
    next(error);
  }
});

//POST team
router.post("/api/teams", async (req, res, next) => {
  try {
    const newTeam = await Team.create({
      //FYI: members & team lead remain empty, can only be set in "put"
      teamName: req.body.teamName,
      company: req.body.company,
      createdBy, //TODO: AFTER AUTH IMPLEMENTATION
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

//PUT
router.put("/api/teams/:id", async (req, res, next) => {
  //TODO after auth
});

//DELETE
router.delete("/api/teams/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    // Find users assigned to this team
    const usersWithTeam = await User.find({ team: id });

    if (usersWithTeam.length) {
      // There are users assigned to this team, return arr of obj containing these users to make it easy for admin
      return res.status(409).json({
        message:
          "Cannot delete team: users are still assigned to this team. Please reassign all users to other teams first.",
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
    res.json({ message: "Team deleted successfully." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
