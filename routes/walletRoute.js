const router = require("express").Router();
const { transsactionTypes, transsactionStatus } = require("../enums/types");
const {
  WalletTransaction,
  Wallet,
  Partner,
  CustomerWallet,
  Customer,
  PartnerWallet,
} = require("../models");

const checkPartner = require("../middleware/AuthPartner");
const checkCustomer = require("../middleware/AuthCustomer");
const { getAllWallletTranssaction } = require("../services/Wallet");

/**
 * @openapi
 * /wallet/transaction/customer:
 *  get:
 *    summary: fetch all wallet transaction in assending order by date
 *    tags:
 *    - wallet Routes
 *    responses:
 *      500:
 *          description: if internal server error occured while performing request.
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: Error encountered.
 *    security:
 *    - bearerAuth: []
 */
router.get("/transaction/customer", checkCustomer, async (req, res) => {
  const id = req.Customer._id;
  try {
    const data = await getAllWallletTranssaction(id, "customer");
    return res
      .status(200)
      .json({ message: "customer Transsaction list", data });
  } catch (error) {
    return res.status(500).json({
      message: "Error encountered while trying to fetch transaction.",
    });
  }
});

/**
 * @openapi
 * /wallet/partner:
 *  get:
 *    summary: used to get wallet of partner
 *    tags:
 *    - wallet Routes
 *    responses:
 *      500:
 *          description: if internal server error occured while performing request.
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: Error encountered.
 *    security:
 *    - bearerAuth: []
 */
router.get("/partner", checkPartner, async (req, res) => {
  const id = req.partner._id;
  try {
    const data = await PartnerWallet.findOne({ partnerId: id });
    if (data) {
      return res.status(200).json({ message: "wallet state", data });
    } else {
      return res.status(404).json({ message: "wallet not found" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error encountered while trying to fetching wallet" });
  }
});

/**
 * @openapi
 * /wallet/customer:
 *  get:
 *    summary: used to get wallet of customer
 *    tags:
 *    - wallet Routes
 *    responses:
 *      500:
 *          description: if internal server error occured while performing request.
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: Error encountered.
 *    security:
 *    - bearerAuth: []
 */
router.get("/customer", checkCustomer, async (req, res) => {
  const id = req.Customer._id;

  try {
    const data = await CustomerWallet.findOne({ customerId: id });
    if (data) {
      return res.status(200).json({ message: "wallet state", data });
    } else {
      return res.status(404).json({ message: "wallet not found" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error encountered while trying to fetching wallet" });
  }
});

module.exports = router;
