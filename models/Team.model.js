const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const TeamSchema = new Schema(
  {
    teamName: { type: String, required: true, maxlength: 50 },
    company: { type: Schema.Types.ObjectId, ref: "Company" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);
// Add compound unique index (Unique teams per company)
TeamSchema.index({ teamName: 1, company: 1 }, { unique: true });

module.exports = model("Team", TeamSchema);
