const { isEmpty, trim } = require("../libs/checkLib");
const { Customer } = require("../models");
const { verifyAccessToken } = require('../services/token-service');

async function checkCustomer(req, res, next) {
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

    const customer = await Customer.findOne({ _id: data._id });
    if (customer === null) {
      return res.status(401).json({
        message: "Customer not found",
      });
    }
    req.Customer = customer;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "invalid access token or expire",
    });
  }
}

module.exports = checkCustomer;
