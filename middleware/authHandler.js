const jwt = require("jsonwebtoken");

function isAuthenticated(req, res, next) {
  try {
    // Check if the authorization header exists and is properly formatted
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json("Token not provided or not valid");
    }
    //get token from authorization header "Bearer 4567d2w..."
    const token = req.headers.authorization.split(" ")[1];

    //Verify token, if verified -> payload
    const payload = jwt.verify(token, process.env.TOKEN_SECRET);

    //Add payload to request object for use in next middleware or route
    req.payload = payload;

    //call next to pass the rquest on
    next();
  } catch (error) {
    res.status(401).json("token not provided or not valid");
  }
}

function isAdmin(req, res, next) {
  if (req.payload && req.payload.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access required." });
}

module.exports = { isAuthenticated, isAdmin };
