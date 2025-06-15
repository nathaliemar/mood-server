require("dotenv").config();
const mongoose = require("mongoose");
const MoodEntry = require("../models/MoodEntry.model");

const MONGODB_URI = process.env.MONGODB_URI;
const COMPANY_ID = "684b0bc0439ef679740775b2";
//Add a specific company id to moodEntries without company id
async function addCompanyToMoodEntries() {
  await mongoose.connect(MONGODB_URI);

  const result = await MoodEntry.updateMany(
    {},
    { $set: { company: new mongoose.Types.ObjectId(COMPANY_ID) } }
  );

  console.log(`Updated ${result.modifiedCount} mood entries.`);
  await mongoose.disconnect();
}

addCompanyToMoodEntries().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
