const express = require("express");
const router = express.Router();
const Company = require("../models/Company.model");

//Create new company and return ID
router.post("/api/companies", async (req, res, next) => {
  try {
    const { name } = req.body; // createdBy is the user id (to be set after user creation, in authRoute)
    if (!name)
      return res.status(400).json({ message: "Company name required" });

    // Create company (createdBy will be set after user creation)
    const company = await Company.create({ name, createdBy: null });
    res.status(201).json(company);
  } catch (error) {
    next(error);
  }
});

// Get company by ID
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
