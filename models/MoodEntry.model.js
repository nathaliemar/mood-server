const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const MoodEntrySchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, //Can then also be used to get team and company
    score: { type: Number, min: 1, max: 5, required: true },
    note: { type: String, default: null },
    //date without time
    date: {
      type: Date,
      default: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      },
    },
  },
  { timestamps: true }
);

module.exports = model("Mood", MoodEntrySchema);
