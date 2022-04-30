const router = require("express").Router();
const { rejectBadRequests } = require("../middleware");
const { body } = require("express-validator");
const { generateOtp, sendOtp } = require("../libs/otpLib");
const { Partner } = require("../models");
const checkPartner = require("../middleware/AuthPartner");

const sendOtpBodyValidator = [
  body("phone")
    .notEmpty()
    .withMessage("phone number cannot be empty")
    .isString()
    .withMessage("phone number should be string"),
];
const verifyOtpBodyValidator = [
  body("otp")
    .notEmpty()
    .withMessage("otp number cannot be empty")
    .isString()
    .withMessage("otp number should be string"),
  body("phone")
    .notEmpty()
    .withMessage("phone number cannot be empty")
    .isString()
    .withMessage("phone number should be string"),
];

/**
 * @openapi
 * /partner/SendOTP:
 *  post:
 *    summary: request server to genrate and send otp on given number.
 *    tags:
 *    - partner Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                phone:
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
 *                   items:
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
 */
router.post(
  "/SendOTP",
  ...sendOtpBodyValidator,
  rejectBadRequests,
  async (req, res) => {
    //generate new otp
    let otp = generateOtp(6);
    try {
      //check if partner with given number exists and update otp in db, else create new partner.
      const partner = await Partner.findOneAndUpdate(
        { phone: req?.body?.phone },
        {
          otp: {
            code: otp,
            status: "active",
          },
        },
        { upsert: true, new: true }
      );
      //send otp to user
      sendOtp(partner.phone, otp);
      return res
        .status(200)
        .json({ message: "OTP has been sent successfully" });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Error encountered while trying to send otp" });
    }
  }
);

/**
 * @openapi
 * /partner/VerifyOTP:
 *  post:
 *    summary: used to verify otp provided by user.
 *    tags:
 *    - partner Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                phone:
 *                  type: string
 *                otp:
 *                  type: string
 *    responses:
 *      200:
 *          description: if user exists and otp is sent successfully
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: OTP verified successfully.
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
 *                   items:
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
 */
router.post(
  "/VerifyOTP",
  ...verifyOtpBodyValidator,
  rejectBadRequests,
  async (req, res) => {
    try {
      const partner = await Partner.findOneAndUpdate(
        {
          phone: req?.body?.phone,
          "otp.code": req?.body?.otp,
          "otp.status": "active",
        },
        {
          "otp.status": "inactive",
          isVerified: true,
        },
        { new: true }
      );
      if (partner === null) {
        return res.status(401).json({ message: "Invalid OTP" });
      }
      return res
        .status(200)
        .json({ message: "OTP verified successfully", uid: partner._id });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error encountered while trying to verify otp" });
    }
  }
);

module.exports = router;
