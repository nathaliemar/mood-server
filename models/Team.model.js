const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const TeamSchema = new Schema(
  {
    teamName: { type: String, unique: true, required: true, maxlength: 50 },
    company: { type: Schema.Types.ObjectId, ref: "Company" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = model("Team", TeamSchema);
