const express = require("express");
const { middlewareConfig } = require("./config/middleware.config");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const mongoose = require("mongoose");
require("dotenv").config();

const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

//Initialize App
const app = express();

//Middleware
middlewareConfig(app);

//DB Connection
mongoose
  .connect(MONGODB_URI)
  .then((x) => console.log(`Connected to database: "${x.connections[0].name}"`))
  .catch((err) => console.error("Error connecting to MongoDB", err));

//ROUTES
const teamRoute = require("./routes/team.route");
app.use("/", teamRoute);
const authRoute = require("./routes/auth.route");
app.use("/", authRoute);
const moodEntryRoute = require("./routes/moodEntry.route");
app.use("/", moodEntryRoute);
const userRoute = require("./routes/user.route");
app.use("/", userRoute);
const companyRoute = require("./routes/company.route");
app.use("/", companyRoute);
//ERROR HANDLING
//Not found
app.use(notFoundHandler);
//Other
app.use(errorHandler);
//START SERVER
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
