const express = require("express");
const { middlewareConfig } = require("./config/middleware.config");
require("dotenv").config();

const PORT = process.env.PORT;

//Initialize App
const app = express();

//Middleware
middlewareConfig(app);

//DB Connection

//ROUTES

//ERROR HANDLING
//Not found

//Other

//START SERVER
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
