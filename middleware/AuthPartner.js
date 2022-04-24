const { isEmpty, trim } = require("../libs/checkLib");
const { Partner } = require("../models");

async function checkPartner(req, res, next) {
  try {
    let token = trim(req?.headers["authorization"]);
    if (isEmpty(token)) {
      return res.status(404).json({
        success: false,
        message: "Auth token is not supplied",
      });
    }
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length);
    }

    const partner = await Partner.findOne({ _id: token });
    if (partner === null) {
      return res.status(404).json({
        message: "partner not found",
      });
    }
    req.partner = partner;
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "ERROR",
    });
  }
}

module.exports = checkPartner;
