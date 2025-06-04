const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const TeamSchema = new Schema(
  {
    teamName: { type: String, unique: true, required: true, maxlength: 50 },
    company: { type: String, maxlength: 100 },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teamLeads: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = model("Team", TeamSchema);
