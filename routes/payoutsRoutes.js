const router = require("express").Router();
const Payouts = require("../libs/payments/payouts");
const checkPartner = require("../middleware/AuthPartner");
const partnerBankDetailsModel = require("../models/partnerbankDetails");
const { Partner } = require("../models");
const Cashfree = require("cashfree-sdk");
var crypto = require("crypto");
var shasum = crypto.createHash("sha256");

/**
 * @openapi
 * /payouts/verifydetails:
 *  get:
 *    summary: partner veriify bank details details
 *    tags:
 *    - payouts Routes
 *    parameters:
 *      - in: query
 *        name: bankAccount
 *        required: true
 *        schema:
 *           type: string
 *      - in: query
 *        name: ifsc
 *        required: true
 *        schema:
 *           type: string
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
router.get("/verifydetails", checkPartner, async (req, res) => {
  const { bankAccount, ifsc } = req.query;

  if (!bankAccount || !ifsc) {
    return res.status(400).json({ message: "bankAccount ifsc are required" });
  }

  try {
    const { data } = await Payouts.verifyBankAccountCashfree(bankAccount, ifsc);
    return res.status(200).json({ message: "verification result.", data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /payouts/create-update-bankdetails:
 *  post:
 *    summary:partners to create and update a bank details:
 *    tags:
 *    - payouts Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                phone:
 *                  type: string
 *                bankAccount:
 *                  type: string
 *                ifsc:
 *                  type: string
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
router.post("/create-update-bankdetails", checkPartner, async (req, res) => {
  const partnerId = req.partner._id;
  const { name, phone, bankAccount, ifsc, address1 } = req.body;
  const benId = `BEN_${partnerId}`;

  try {
    const partnerDetails = await Partner.findById(partnerId);
    if (!partnerDetails) {
      return res.status(404).json({ message: "no partner found" });
    }

    const isDetailsExist = await partnerBankDetailsModel.findOne({ partnerId });
    const payload = {
      email: partnerDetails.email,
      name,
      phone: partnerDetails.phone,
      bankAccount,
      ifsc,
      address1: partnerDetails.address.street || "N/A",
    };

    if (!isDetailsExist) {
      await Payouts.createBeneficiaryToCashhfree({ beneId: benId, ...payload });
      await Payouts.createUpdateAccountDetails(partnerId, {
        beneId: benId,
        ...payload,
      });
      return res
        .status(200)
        .json({ message: "bank details created successfully." });
    }
    await Payouts.updateBeneficiaryToCashfree(isDetailsExist["beneId"], {
      beneId: isDetailsExist["beneId"],
      ...payload,
    });

    await Payouts.createUpdateAccountDetails(partnerId, payload);
    return res
      .status(200)
      .json({ message: "bank details updated successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /payouts/mywithdrawal:
 *  get:
 *    summary:partners to create and update a bank details:
 *    tags:
 *    - payouts Routes
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
router.get("/mywithdrawal", checkPartner, async (req, res) => {
  const partnerId = req.partner._id;
  try {
    const mypayouts = await Payouts.myWithdrawals(partnerId);
    return res.status(200).json({ message: "my payouts", mypayouts });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /payouts/mybankdetails:
 *  get:
 *    summary:api to get partners bank details:
 *    tags:
 *    - payouts Routes
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
router.get("/mybankdetails", checkPartner, async (req, res) => {
  const partnerId = req.partner._id;
  try {
    const details = await partnerBankDetailsModel.findOne({
      partnerId: partnerId,
    });
    return res.status(200).json({ message: "my payouts", details });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /payouts/withdrawPayout:
 *  get:
 *    summary:initiates the payouts:
 *    tags:
 *    - payouts Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                payoutId:
 *                  type: string
 *                orderId:
 *                  type: string
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
router.post("/withdrawPayout", checkPartner, async (req, res) => {
  const { paymentArray } = req.body;
  const partnerId = req.partner._id;

  if (!Array.isArray(paymentArray) || paymentArray.length <= 0) {
    return res.status(400).json({ message: "paymentArray are  required" });
  }

  if (
    (paymentArray.length === 1 && !paymentArray[0].payoutId) ||
    !paymentArray[0].orderId
  ) {
    return res
      .status(400)
      .json({ message: "payoutId or orderId are required" });
  }

  try {
    if (paymentArray.length > 1) {
      await Payouts.initiatebulkPayout(partnerId, paymentArray);
      return res.status(200).json({ message: "payouts initiates" });
    } else {
      await Payouts.initiateSinglePayout(
        partnerId,
        paymentArray[0].orderId,
        paymentArray[0].payoutId
      );
      return res.status(200).json({ message: "payouts initiates" });
    }
    return res.status(400).json({ message: "something wrong happend" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: error.message || "Error encountered." });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    console.log(req.body, process.env.PAYOUT_CLIENT_SECRET);
    const { signature } = req.body;

    let obj = req.body;
    // delete obj.signature;
    let Payouts = Cashfree.Payouts;
    Payouts.Init({
      "ENV": process.env.CASH_FREE_MODE,
      "ClientID": process.env.PAYOUT_CLIENT_KEY,
      "ClientSecret": process.env.PAYOUT_CLIENT_SECRET
    });
    const resp = await Payouts.VerifySignature(
      obj
    );
    console.log(resp);
    // await Payouts.initiatePayout(partnerId, orderId, payoutId);
    if (!resp) {
      return res.status(401).json({ message: "Bad Request" });
    }
    //{
    // event: 'LOW_BALANCE_ALERT',
    // currentBalance: '100.00',
    // alertTime: '2022-12-20 22:06:14',
    // signature: 'G5/QKP6EkyCv8mK4YcN35AaYDcv8wb1wCnpw4UYP8Gs='}
    // above is sample body below goes code for updating transactions
    return res.status(200).json({ message: "signature verified" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: error.message || "Error encountered." });
  }
});
module.exports = router;
