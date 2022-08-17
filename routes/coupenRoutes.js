const { offerPromoType } = require('../enums/types');
const { rejectBadRequests } = require('../middleware');
const { checkAdmin } = require('../middleware/AuthAdmin');
const { Coupon } = require('../models');
const { body } = require("express-validator");


const router = require("express").Router();

const verifyAddCooupenValidator = [
    body("promoCode")
        .notEmpty()
        .withMessage("promoCode cannot be empty")
        .isString()
        .withMessage("promoCode should be string"),
    body("promoType")
        .notEmpty()
        .withMessage("promoType cannot be empty")
        .isIn(offerPromoType)
        .withMessage("promoType cannot be empty"),
    body("title")
        .notEmpty()
        .withMessage("title cannot be empty")
        .isString()
        .withMessage("title should be string"),
    body("offerAmount")
        .notEmpty()
        .withMessage("offerAmount cannot be empty")
        .isNumeric().withMessage("offerAmount should be number"),
    body("percentageOff")
        .notEmpty()
        .withMessage("percentageOff cannot be empty")
        .isNumeric().withMessage("percentageOff should be number"),
    body("maxDisc")
        .notEmpty()
        .withMessage("maxDisc cannot be empty")
        .isNumeric().withMessage("maxDisc should be number"),
    body("minCartValue")
        .notEmpty()
        .withMessage("minCartValue cannot be empty")
        .isNumeric().withMessage("minCartValue should be number"),
    body("startValidity")
        .exists()
        .not()
        .isEmpty()
        .withMessage('start cannot be empty')
        .isISO8601('yyyy-mm-dd')
        .matches('^([0-9]|0[0-9]|1[0-9]|2[0-3])')
        .withMessage('start must be in correct format yyyy:mm:dd'),
    body("endValidity")
        .exists()
        .not()
        .isEmpty()
        .withMessage('start cannot be empty')
        .isISO8601('yyyy-mm-dd')
        .matches('^([0-9]|0[0-9]|1[0-9]|2[0-3])')
        .withMessage('start must be in correct format yyyy:mm:dd')
];

const getPromoCodeById = async (id) => {
    try {
        const resp = await Coupon.findById(id);
        return resp;
    } catch (error) {
        throw new Error(error)
    }
}


/**
 * @openapi
 * /coupen:
 *  post:
 *    summary: Admin can create new offer code
 *    tags:
 *    - Coupen Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                promoCode:
 *                  type: string
 *                  description: required should be string
 *                promoType:
 *                  type: string
 *                  description: required should be string
 *                offerType:
 *                  type: string
 *                  description: required should be string or flat,upto
 *                title:
 *                  type: string
 *                  description: required should be string
 *                description:
 *                  type: string  not required
 *                offerAmount:
 *                  type: number
 *                  description: required
 *                percentageOff:
 *                  type: number
 *                  description: required
 *                maxDisc:
 *                  type: number
 *                  description: required
 *                minCartValue:
 *                  type: number
 *                  description: required
 *                startValidity:
 *                  type: number
 *                  description: required yyyy-mm-dd
 *                endValidity:
 *                  type: number
 *                  description: required  yyyy-mm-dd
 *    responses:
 *      200:
 *          description: new coupen generated
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: new coupen generated
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
 */
router.post("/", checkAdmin, verifyAddCooupenValidator, rejectBadRequests, async (req, res) => {
    const { promoCode } = req.body;

    // const { promoCode, promoType, offerType, title, description, offerAmount, percentageOff, maxDisc, minCartValue, startValidity, endValidity } = req.body;
    try {
        const isCodePromoExist = await Coupon.findOne({ promoCode });
        if (isCodePromoExist) {
            return res.status(500).json({ message: "Code allready exists" });
        }

        const newCoupen = new Coupon(req.body);
        const resp = await newCoupen.save();
        return res.status(200).json({ message: "new coupen generated", data: resp });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error encountered while trying to update user." });
    }
});



/**
 * @openapi
 * /coupen:
 *  get:
 *    summary: Admin get all promocode list
 *    tags:
 *    - Coupen Routes
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
router.get("/", checkAdmin, verifyAddCooupenValidator, rejectBadRequests, async (req, res) => {
    try {
        const resp = await Coupon.find({});
        return res.status(200).json({ message: "promocode  list", data: resp });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error encountered while trying to update user." });
    }
});


/**
 * @openapi
 * /coupon/:id:
 *  put:
 *    summary: admin update promocode by its _id
 *    tags:
 *    - Coupen Routes
 *    parameters:
 *      - in: path
 *        name: id
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
router.put("/:id", checkAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(500).json({ message: "promocode _id required" });
    }

    try {
        const isCodePromoExist = await getPromoCodeById(id);
        if (!isCodePromoExist) {
            return res.status(500).json({ message: "Code not found" });
        }

        const resp = await Coupon.findByIdAndUpdate(id, req.body, { new: true });
        return res.status(200).json({ message: "code updated successfully", data: resp });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error encountered while trying to update user." });
    }
});

module.exports = router;