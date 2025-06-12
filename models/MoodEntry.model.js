const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const MoodEntrySchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, //Can then also be used to get team and company
    score: { type: Number, min: 1, max: 5, required: true },
    note: { type: String, default: null },
    //date at midnight, to be passed from frontend
    date: {
      type: Date,
      required: true,
    },
    company: { type: Schema.Types.ObjectId, ref: "Company" },
  },
  { timestamps: true }
);

module.exports = model("MoodEntry", MoodEntrySchema);
