require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../models/User.model");
const Team = require("../models/Team.model");
const MoodEntry = require("../models/MoodEntry.model");
const Company = require("../models/Company.model");

const USER_ID = null; // <-- update with desired ID
const MONGODB_URI = process.env.MONGODB_URI;
//migrate all documents to contain a company object id instead of string
//You need to provide a USER_ID that will be listed as author of the company

async function migrate() {
  await mongoose.connect(MONGODB_URI);

  // 1. Gather all unique company names from users, teams, mood entries
  const userCompanies = await User.distinct("company");
  const teamCompanies = await Team.distinct("company");
  const moodCompanies = await MoodEntry.distinct("company");

  // Filter out already-objectIds (if any) and only keep strings
  const allCompanyStrings = [
    ...userCompanies,
    ...teamCompanies,
    ...moodCompanies,
  ].filter((c) => typeof c === "string" && c.trim() !== "");

  const uniqueCompanyNames = [...new Set(allCompanyStrings)];

  // 2. Create Company documents for each unique name
  const nameToId = {};
  for (const name of uniqueCompanyNames) {
    let company = await Company.findOne({ name });
    if (!company) {
      company = await Company.create({
        name,
        createdBy: new mongoose.Types.ObjectId(`${USER_ID}`),
      });
      console.log(`Created company: ${name} -> ${company._id}`);
    }
    nameToId[name] = company._id;
  }

  // 3. Update Users

  for (const [name, id] of Object.entries(nameToId)) {
    await User.updateMany(
      { company: name, company: { $type: "string" } },
      { $set: { company: id } }
    );
    await Team.updateMany(
      { company: name, company: { $type: "string" } },
      { $set: { company: id } }
    );
    await MoodEntry.updateMany(
      { company: name, company: { $type: "string" } },
      { $set: { company: id } }
    );
  }

  console.log("Migration complete!");
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
