const checkTokenOnly = require('../middleware/checkToken');
const { Feedback } = require("../models");
const router = require("express").Router();

const createFeedback = async (userType, userId, data) => {
    try {
        const newFeedback = new Feedback({
            ...data,
            partnerId: userType === "partner" ? userId : null,
            customerId: userType === "customer" ? userId : null
        })
        return newFeedback.save();
    } catch (error) {
        throw new Error('Error accure');
    }
}

/**
 * @openapi
 * /feedback:
 *  post:
 *    summary: use to create new feedback by customer or partner
 *    tags:
 *    - Feedback Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                userType:
 *                  type: string
 *                ratting:
 *                  type: string
 *                title:
 *                  type: string
 *                description:
 *                  type: string
 *    responses:
 *      200:
 *          description: if successfully found user
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               description: customer details
 *      404:
 *          description: if user not found or auth token not supplied.
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
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
router.post("/", checkTokenOnly, async (req, res) => {
    const { userType } = req.body;
    const id = req.data._id;

    if (!userType || (userType !== "partner" && userType !== "customer")) {
        return res.status(400).json({ message: "userType is required or should be customer or partner" });
    }

    try {
        const isCreate = await createFeedback(userType, id, req.body);
        return res.status(200).json({
            response: "Thanks for your valuable feedback",
            data: isCreate
        });
    } catch (error) {
        return res.status(500).json({ message: "Error encountered." });
    }
});

/**
 * @openapi
 * /feedback/{userType}:
 *  get:
 *    summary: used to fetch a feedbacks
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

router.get("/:userType", checkTokenOnly, async (req, res) => {
    const { userType } = req.params;
    if (!userType || (userType !== "partner" && userType !== "customer")) {
        return res.status(400).json({ message: "userType is required or should be customer or partner" });
    }
    let feedbacks = null;

    try {
        if (userType === "customer") {
            feedbacks = await Feedback.find({ customerId: { $ne: null } }).sort({ createdAt: -1 });
        } else {
            feedbacks = await Feedback.find({ partnerId: { $ne: null } }).sort({ createdAt: -1 });
        }
        return res.status(200).json({ message: "feedbacks details", data: feedbacks });
    } catch (error) {
        return res.status(500).json({ message: "Error encountered." });
    }
});


module.exports = router;