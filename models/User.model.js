const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, maxlength: 254 },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 100,
    },
    firstName: { type: String, maxlength: 50 },
    lastName: { type: String, maxlength: 50 },
    company: { type: String, maxlength: 100, required: true },
    team: { type: Schema.Types.ObjectId, ref: "Team" },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    imageUrl: {
      type: String,
      default: () =>
        `https://ui-avatars.com/api/?name=${this.firstName}+${this.lastName}&background=random`,
    }, //TODO: Fine tune Colors/Size etc
  },
  { timestamps: true }
);

module.exports = model("User", UserSchema);
