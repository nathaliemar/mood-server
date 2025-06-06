const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const router = express.Router();
const { isAuthenticated } = require("../middleware/authHandler");

// POST /auth/signup
router.post("/api/auth/signup", async (req, res, next) => {
  const { email, password, firstName, lastName, company } = req.body;
  //Check if any required attributes are an empty string
  if (
    email === "" ||
    password === "" ||
    firstName === "" ||
    lastName === "" ||
    company === ""
  ) {
    res
      .status(400)
      .json({ message: "Provide email, password, name and company name" });
    return;
  }
  //Regex to validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Provide a valid email address" });
    return;
  }
  //Regex to validate Password
  const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;
  if (!passwordRegex.test(password)) {
    res.status(400).json({
      message:
        "Password must have at least 8 characters and contain at least one number, one lowercase and one uppercase letter.",
    });
    return;
  }

  try {
    const foundUser = await User.findOne({ email });
    if (foundUser)
      return res.status(400).json({ message: "User already exists" });

    //If user not yet existing, continue with hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //Create new user in DB
    const newUser = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      company,
    });
    // Deconstruct the newly created user object to omit the password
    // We should never expose passwords publicly
    const {
      email: userEmail,
      firstName: userFirstName,
      lastName: userLastName,
      _id,
      company: userCompany,
      role: userRole,
      team: userTeam,
      imageUrl: userImageUrl,
    } = newUser;
    //user object without password
    const user = {
      email: userEmail,
      firstName: userFirstName,
      lastName: userLastName,
      _id,
      company: userCompany,
      role: userRole,
      team: userTeam,
      imageUrl: userImageUrl,
    };

    res.status(201).json({ user: user });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post("/api/auth/login", async (req, res, next) => {
  const { email, password } = req.body;

  //check if email or password are empty
  if (email === "" || password === "") {
    res.status(400).json({ message: "Provide email and password." });
    return;
  }

  try {
    //check users collection if user with same email exists
    const foundUser = await User.findOne({ email });
    //handle if user not found
    if (!foundUser) {
      // If the user is not found, send an error response
      res.status(401).json({ message: "User not found." });
      return;
    }
    //compare requestbody password w/ stored password
    const passwordCorrect = bcrypt.compareSync(password, foundUser.password);
    if (passwordCorrect) {
      //deconstruct user's details to omit password
      const { _id, email, firstName, lastName, company } = foundUser;

      //create object that will be used as token payload
      const payload = { _id, email, firstName, lastName, company };

      //create + sign token
      const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
        algorithm: "HS256",
        expiresIn: "6h",
      });

      //Send token as response
      res.status(200).json({ authToken: authToken });
    } else {
      res.status(401).json({ message: "Unable to authenticate user" });
    }
  } catch (error) {
    next(error);
  }
});

//GET currently logged in user
//use to display "live" up to date user data, keep token lean
router.get("/api/auth/me", isAuthenticated, async (req, res, next) => {
  try {
    // req.payload._id is set by isAuthenticated middleware
    const user = await User.findById(req.payload._id).select("-password"); //omit pw in resp
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

//GET auth/verify
//use for quick token validation, does not update live
router.get("/api/auth/verify", isAuthenticated, (req, res) => {
  //If valid token, payload gets decoded by isAuth middleware and provided in payload
  console.log(`req.payload`, req.payload);
  res.status(200).json(req.payload);
});

module.exports = router;
