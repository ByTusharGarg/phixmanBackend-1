const { trim } = require("../libs/checkLib");
const tokenService = require("../services/token-service");

const validateTempToken = async (req, res, next) => {
  try {
    if (!req.headers["authorization"]) {
      return res.status(401).json({ message: "authorization not found" });
    }
    let token = trim(req.headers["authorization"]);

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length);
    }

    if (!token) {
      return res.status(401).json({ message: "Token not found" });
    }

    const tempData = await tokenService.verifyTempToken(token);

    if (!tempData) {
      res.status(401).json({ message: "Token mismatch try again" });
    }
    req.tempdata = tempData;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = validateTempToken;
