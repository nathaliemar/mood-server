const express = require("express");
const router = express.Router();
const Company = require("../models/Company.model");

//POST new company and return ID
router.post("/api/companies", async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Company name required" });

    // Create company (createdBy will be set after user creation, see auth route)
    const company = await Company.create({ name, createdBy: null });
    res.status(201).json(company);
  } catch (error) {
    next(error);
  }
});

// GET company by ID
router.get("/api/companies/:id", async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.json(company);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
