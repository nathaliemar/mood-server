const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const CompanySchema = new Schema(
  {
    name: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = model("Company", CompanySchema);
