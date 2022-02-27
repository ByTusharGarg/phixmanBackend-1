const { isEmpty, trim } = require("../libs/checkLib");
const { Customer } = require("../models");

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

    const customer = await Customer.findOne({ _id: token });
    if (customer === null) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }
    req.Customer = customer;
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "ERROR",
    });
  }
}

module.exports = checkCustomer;
