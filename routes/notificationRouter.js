const partnerPopNotification = require('../libs/popupnotification/partnernotification');
const checkCustomer = require('../middleware/AuthCustomer');
const checkPartner = require('../middleware/AuthPartner');
const router = require("express").Router();
const {Customer,Partner} = require("../models");

let payload = {
    notification: {
        title: "hello",
        body: `welcome to phixman`
    },
    data:{}
}

// const token = "euafcmf6SaS_97UxoTpzoc:APA91bFwfz77GCc8l7VKqpEP9FwK5C42Oj34YAF3PMNJ6D7FEOhv-iyZ20frIdzAJXo1ywcO3gsXTR76mzSqG5ZXUML2s4WN3vGG26leV3loVLuf3yRd38ckN3N3Slv2Wd7FcHklvXRQ";
// partnerPopNotification.sendToCustomerPopUpNotiFication(token,payload);

/**
 * @openapi
 * /notification/partner/fcm:
 *  put:
 *    summary: using this route update partner fcm token
 *    tags:
 *    - notification Routes
 *    parameters:
 *      - in: path
 *        name: fmctoken
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
router.put("/partner/fcm", checkPartner, async (req, res) => {
    const { fmctoken } = req.body;
    const partnerId = req.partner._id;

    if (!fmctoken) {
        return res
            .status(500)
            .json({ message: "fmctoken must be provided" });
    }

    try {
        await Partner.findByIdAndUpdate(partnerId, { fcmToken: fmctoken });
        return res.status(200).json({ message: "token updated" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error encountered." });
    }
});


/**
 * @openapi
 * /notification/customer/fcm:
 *  put:
 *    summary: using this route update customer fcm token
 *    tags:
 *    - notification Routes
 *    parameters:
 *      - in: path
 *        name: fmctoken
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
router.put("/customer/fcm", checkCustomer, async (req, res) => {
    const { fmctoken } = req.body;
    const cid = req.Customer._id;

    if (!fmctoken) {
        return res
            .status(500)
            .json({ message: "fmctoken must be provided" });
    }

    try {
        await Customer.findByIdAndUpdate(cid, { fcmToken: fmctoken });
        return res.status(200).json({ message: "token updated" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error encountered." });
    }
});

module.exports = router;