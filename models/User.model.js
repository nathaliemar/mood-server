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
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
      lowercase: true,
    },
    imageUrl: { type: String },
    isTeamlead: { type: Boolean, default: false },
  },
  { timestamps: true }
);
//Pre-save hook to make sure the Icon Assignment does not end in "undefined"
UserSchema.pre("save", function (next) {
  if (!this.imageUrl) {
    const first = this.firstName || "";
    const last = this.lastName || "";
    this.imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      first
    )}+${encodeURIComponent(last)}&background=random`;
  }
  next();
});

module.exports = model("User", UserSchema);
