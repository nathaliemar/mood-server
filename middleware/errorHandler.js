function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
}

function notFoundHandler(req, res, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
}
module.exports = { errorHandler, notFoundHandler };
