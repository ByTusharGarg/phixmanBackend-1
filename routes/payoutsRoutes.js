const router = require("express").Router();
const Payouts = require("../libs/payments/payouts");
const checkPartner = require('../middleware/AuthPartner');
const partnerBankDetailsModel = require('../models/partnerbankDetails');
const { Partner } = require("../models");

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
            phone,
            bankAccount,
            ifsc,
            address1: partnerDetails.address.street || "N/A"
        };


        if (!isDetailsExist) {
            await Payouts.createBeneficiaryToCashhfree({ beneId: benId, ...payload });
            await Payouts.createUpdateAccountDetails(partnerId, { beneId: benId, ...payload });
            return res.status(200).json({ message: "bank details created successfully." });
        }

        await Payouts.updateBeneficiaryToCashfree(isDetailsExist['beneId'], { beneId: isDetailsExist['beneId'], ...payload });
        await Payouts.createUpdateAccountDetails(partnerId, { beneId: isDetailsExist['benId'], ...payload });
        return res.status(200).json({ message: "bank details updated successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error encountered." });
    }
});


module.exports = router;