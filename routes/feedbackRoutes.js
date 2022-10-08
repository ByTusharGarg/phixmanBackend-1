const checkPartner = require('../middleware/AuthPartner');
const checkTokenOnly = require('../middleware/checkToken');
const { Feedback } = require("../models");
const router = require("express").Router();

/**
 * @openapi
 * /feedback:
 *   post:
 *    summary: create feedback
 *    tags:
 *    - Feedback Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                partnerId:
 *                  type: string
 *                customerId:
 *                  type: string
 *                orderId:
 *                  type: string
 *                userType:
 *                  type: string
 *                userRatting:
 *                  type: string
 *                phixmenRatting:
 *                  type: string
 *                userDescription:
 *                  type: string
 *                phixmenDescription:
 *                  type: string
 *    responses:
 *      200:
 *          description: if order cancelled successfully
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: OTP has been sent successfully.
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
 *     - bearerAuth: []
 */
router.post("/", checkTokenOnly, async (req, res) => {
    const { userType } = req.body;

    if (!userType || (userType !== "partner" && userType !== "customer")) {
        return res.status(400).json({ message: "userType is required or should be customer or partner" });
    }

    try {
        const newFeedback = new Feedback({ ...req.body, from: userType });
        const isCreate = await newFeedback.save();

        return res.status(200).json({
            response: "Thanks for your valuable feedback"
        });
    } catch (error) {
        return res.status(500).json({ message: "Error encountered." });
    }
});

/**
 * @openapi
 * /feedback/allfeedback/{userType}:
 *  get:
 *    summary: admin to fetch all feedbacks
 *    tags:
 *    - Feedback Routes
 *    parameters:
 *      - in: path
 *        name: userType
 *        required: true
 *        schema:
 *           type: string
 *           enum: ["partner","customer"]
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

router.get("/allfeedback/:userType", checkTokenOnly, async (req, res) => {
    const { userType } = req.params;
    if (!userType || (userType !== "partner" && userType !== "customer")) {
        return res.status(400).json({ message: "userType is required or should be customer or partner" });
    }

    try {
        const feedbacks = await Feedback.find({ from: userType })
            .populate("orderId", "OrderId invoiceId PickUpRequired Status Date")
            .populate("customerId", "Name Address email phone _id")
            .populate("partnerId", "Name Address email phone _id")
            .sort({ createdAt: -1 });
        return res.status(200).json({ message: "feedbacks details", data: feedbacks, totalfeedback: feedbacks.length });
    } catch (error) {
        return res.status(500).json({ message: "Error encountered." });
    }
});

/**
 * @openapi
 * /feedback/partner/{orderid}/myfedback:
 *  get:
 *    summary: used to fetch feedback by orderid
 *    tags:
 *    - Feedback Routes
 *    parameters:
 *      - in: path
 *        name: orderid
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
router.get("/partner/:orderid/myfedback", checkPartner, async (req, res) => {
    const { orderid } = req.params;
    const partnerId = req.partner._id;

    try {
        const feedback = await Feedback.findOne({ orderId: orderid, partnerId, from: "partner" });
        return res.status(200).json({ message: "feedback details", data: feedback });
    } catch (error) {
        return res.status(500).json({ message: "Error encountered." });
    }
});

/**
 * @openapi
 * /feedback/consumer/{orderid}/myfedback:
 *  get:
 *    summary: used to fetch feedback by orderid
 *    tags:
 *    - Feedback Routes
 *    parameters:
 *      - in: path
 *        name: orderid
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
router.get("/consumer/:orderid/myfedback", checkPartner, async (req, res) => {
    const { orderid } = req.params;
    const Customer = req.Customer._id;

    try {
        const feedback = await Feedback.findOne({ orderId: orderid, customerId: Customer, from: "customer" });
        return res.status(200).json({ message: "feedback details", data: feedback });
    } catch (error) {
        return res.status(500).json({ message: "Error encountered." });
    }
});


/**
 * @openapi
 * /feedback/{_id}:
 *  delete:
 *    summary: admin can delete feedback by _id
 *    tags:
 *    - Feedback Routes
 *    parameters:
 *      - in: path
 *        name: _id
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
router.delete("/:id", checkPartner, async (req, res) => {
    const { id } = req.params;
    try {
        const feedback = await Feedback.findByIdAndDelete(id);
        return res.status(200).json({ message: "feedback deleted", data: feedback });
    } catch (error) {
        return res.status(500).json({ message: "Error encountered." });
    }
});


module.exports = router;