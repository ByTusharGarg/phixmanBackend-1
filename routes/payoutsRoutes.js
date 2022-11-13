const router = require("express").Router();
const Payouts = require("../libs/payments/payouts");
const checkPartner = require('../middleware/AuthPartner');
const partnerBankDetailsModel = require('../models/partnerbankDetails');
const { Partner } = require("../models");

/**
 * @openapi
 * /payout/verifydetails:
 *  post:
 *    summary: it's use to re estimated order.
 *    tags:
 *    - partner Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                Items:
 *                  type: array
 *                  items:
 *                    properties:
 *                      CategoryId:
 *                        type: string
 *                      ModelId:
 *                        type: string
 *                      ServiceId:
 *                        type: string
 *                      Cost:
 *                        type: integer
 *                OrderId:
 *                  type: string
 *    responses:
 *      200:
 *          description: if otp is sent successfully
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: OTP has been sent successfully.
 *      400:
 *         description: if the parameters given were invalid
 *         content:
 *           application/json:
 *             schema:
 *               required:
 *               - errors
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   description: a list of validation errors
 *                   Items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: object
 *                         description: the value received for the parameter
 *                       msg:
 *                         type: string
 *                         description: a message describing the validation error
 *                       param:
 *                         type: string
 *                         description: the parameter for which the validation error occurred
 *                       location:
 *                         type: string
 *                         description: the location at which the validation error occurred (e.g. query, body)
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
    const partnerId = req.partner._id;
    const { phone, bankAccount, ifsc } = req.query;

    if (!phone || !bankAccount || !ifsc) {
        return res.status(400).json({ message: "phone bankAccount ifsc are required" });
    }

    try {
        const resp = await Payouts.verifyBankAccountCashfree(phone, bankAccount, ifsc);
        return res.status(200).json({ message: "verification result.", resp });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error encountered." });
    }
});


/**
 * @openapi
 * /payout/verifydetails:
 *  post:
 *    summary: it's use to re estimated order.
 *    tags:
 *    - partner Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                Items:
 *                  type: array
 *                  items:
 *                    properties:
 *                      CategoryId:
 *                        type: string
 *                      ModelId:
 *                        type: string
 *                      ServiceId:
 *                        type: string
 *                      Cost:
 *                        type: integer
 *                OrderId:
 *                  type: string
 *    responses:
 *      200:
 *          description: if otp is sent successfully
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: OTP has been sent successfully.
 *      400:
 *         description: if the parameters given were invalid
 *         content:
 *           application/json:
 *             schema:
 *               required:
 *               - errors
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   description: a list of validation errors
 *                   Items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: object
 *                         description: the value received for the parameter
 *                       msg:
 *                         type: string
 *                         description: a message describing the validation error
 *                       param:
 *                         type: string
 *                         description: the parameter for which the validation error occurred
 *                       location:
 *                         type: string
 *                         description: the location at which the validation error occurred (e.g. query, body)
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
router.post("/bankdetails", checkPartner, async (req, res) => {
    const partnerId = req.partner._id;
    const { name, phone, bankAccount, ifsc, address1 } = req.body;
    const benId = `BEN_${partnerId}`;

    try {
        const partnerDetails = await Partner.findById(partnerId);
        if (!partnerDetails) {
            return res.status(404).json({ message: "no partner found" });
        }

        const payload = {
            beneId: benId,
            email: partnerDetails.email,
            name,
            phone,
            bankAccount,
            ifsc,
            address1: partnerDetails.address.street || "N/A"
        };

        const isDetailsExist = await partnerBankDetailsModel.findOne({ partnerId });
        if (!isDetailsExist) {
            await Payouts.createBeneficiaryToCashhfree(data);
            await Payouts.createUpdateAccountDetails(partnerId, payload);
            return res.status(200).json({ message: "bank details created successfully." });
        }

        await Payouts.updateBeneficiaryToCashfree(benId, data);
        await Payouts.createUpdateAccountDetails(partnerId, payload);
        return res.status(200).json({ message: "bank details updated successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error encountered." });
    }
});


module.exports = router;