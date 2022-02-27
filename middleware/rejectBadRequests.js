const { validationResult } = require("express-validator");

function rejectBadRequests(req, res, next) {
  // Give 400 (bad request) on validation error.
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
}

module.exports = rejectBadRequests;
