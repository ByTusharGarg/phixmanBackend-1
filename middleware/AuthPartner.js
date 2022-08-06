const { isEmpty, trim } = require("../libs/checkLib");
const { Partner } = require("../models");
const { verifyAccessToken } = require('../services/token-service');

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

    const data = await verifyAccessToken(token);

    if (!data) {
      res.status(401).json({ message: 'Token mismatch try again' });
    }

    // console.log(token);
    const partner = await Partner.findOne({ _id: data._id });

    // console.log(partner);
    if (partner === null) {
      return res.status(404).json({
        message: "partner not found",
      });
    }
    req.partner = partner;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "invalid access token or expire",
    });
  }
}

module.exports = checkPartner;
