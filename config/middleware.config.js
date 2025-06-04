const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");

function middlewareConfig(app) {
  app.use(express.json());
  app.use(morgan("dev"));
  app.use(express.static("public")); //Todo: Check if used
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // Parse origins from server environment variable or use default
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:5173"];

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true, //TODO: check if needed Add if you're using cookies/authentication
    })
  );
}

module.exports = { middlewareConfig };
