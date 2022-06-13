const router = require("express").Router();
const { rejectBadRequests } = require("../middleware");
const { body } = require("express-validator");
const { generateOtp, sendOtp } = require("../libs/otpLib");
const { Partner, Wallet, Order } = require("../models");
const checkPartner = require("../middleware/AuthPartner");
const { orderStatusTypes } = require('../enums/types');

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

const updatePartnerValidator = [
  body("email").isEmail().withMessage("email is invalid"),
  body("Password").isString().withMessage("password should be a string"),
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
        },
        { new: true }
      );
      if (partner === null) {
        return res.status(401).json({ message: "Invalid OTP" });
      }
      const isWalletExixts = await Wallet.findOne({ partnerId: partner?._id })
      if (!isWalletExixts) {
        const newWallet = new Wallet({ partnerId: partner?._id });
        await newWallet.save();
      }

      return res.status(200).json({
        message: "OTP verified successfully",
        uid: partner._id,
        isActive: partner.isActive,
        isVerified: partner.isVerified,
        isPublished: partner.isPublished,
        type: partner.Type,
      });
    } catch (error) {
      console.log(error)
      return res
        .status(500)
        .json({ message: "Error encountered while trying to verify otp" });
    }
  }
);

router.use(checkPartner);

/**
 * @openapi
 * /partner:
 *  get:
 *    summary: gets user details.
 *    tags:
 *    - partner Routes
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
router.get("/", async (req, res) => {
  console.log(req?.partner);
  return res.status(200).json(req?.partner);
});

/**
 * @openapi
 * /partner:
 *  patch:
 *    summary: used to update user data.
 *    tags:
 *    - partner Routes
 *    requestBody:
 *      content:
 *        multipart/form-data:
 *          schema:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                Password:
 *                  type: string
 *                name:
 *                  type: string
 *                dob:
 *                  type: string
 *                address:
 *                  type: object
 *                  properties:
 *                    city:
 *                      type: string
 *                    state:
 *                      type: string
 *                    country:
 *                      type: string
 *                    street:
 *                      type: string
 *                    pin:
 *                      type: string
 *                    cood:
 *                      type: object
 *                      properties:
 *                        lattitude:
 *                          type: string
 *                        longitude:
 *                          type: string
 *                image:
 *                  type: file
 *                panNumber:
 *                  type: string
 *                pan:
 *                  type: file
 *                aadharNumber:
 *                  type: string
 *                aadhar:
 *                  type: file
 *                gender:
 *                  type: string
 *                  enum: ["male", "female", "non-binary"]
 *                Type:
 *                  type: string
 *                  enum: ["store", "individual"]
 *          encoding:
 *              image:
 *                  contentType: image/png, image/jpeg, image/jpg, image/gif
 *              pan:
 *                  contentType: image/png, image/jpeg, image/jpg, image/gif
 *              aadhar:
 *                  contentType: image/png, image/jpeg, image/jpg, image/gif
 *    responses:
 *      200:
 *          description: if user updated successfully
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: user updated successfully.
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
router.patch(
  "/",
  ...updatePartnerValidator,
  rejectBadRequests,
  async (req, res) => {
    try {
      let update = req?.body;
      update.isVerified = true;
      console.log(update);
      if (req?.body?.email && req?.body?.email === "") {
        update.email = req?.body?.email.toLowerCase();
      }
      if (req?.body?.Password && req?.body?.Password === "") {
        if (!isStrong(req?.body?.Password)) {
          return res
            .status(400)
            .json({ message: "password is not strong enough." });
        }
        update.Password = hashpassword(req?.body?.Password);
      }
      if (req?.files?.image) {
        console.log(req.files);
        update.image = "";
      }
      await Partner.findByIdAndUpdate(req.partner._id, update, { new: true });
      return res.status(200).json({ message: "user updated successfully." });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Error encountered while trying to update user." });
    }
  }
);


/**
 * @openapi
 * /partner/myorders/{status}:
 *  get:
 *    summary: using this route user can get all orders of his/her.
 *    tags:
 *    - partner Routes
 *    parameters:
 *      - in: path
 *        name: status
 *        required: true
 *        schema:
 *           type: string
 *           enum: ["Requested", "Accepted", "InRepair", "completed","all"]
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

router.get("/myorders/:status", async (req, res) => {
  let { status } = req.params;
  const partnerId = req.partner._id;

  if (status !== 'all' && !orderStatusTypes.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  let query = { Partner: partnerId };

  if (status !== 'all') {
    query = { Status: status }
  }

  try {
    const orders = await Order.find(query);
    return res.status(200).json(orders);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});


/**
 * @openapi
 * /partner/order/changestatus:
 *  get:
 *    summary: using this route partner change the order status
 *    tags:
 *    - partner Routes
 *    parameters:
 *      - in: path
 *        name: status
 *        required: true
 *        schema:
 *           type: string
 *           enum: ["Requested", "Accepted", "InRepair", "completed","all"]
 *      - in: path
 *        name: orderId
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
router.post("/order/changestatus", async (req, res) => {
  let { status, orderId } = req.body;
  const partnerId = req.partner._id;


  if (!status || !orderId) {
    return res.status(500).json({ message: "orderId and status must be provided" });
  }

  if (!orderStatusTypes.includes(status)) {
    return res.status(500).json({ message: "Invalid status" });
  }

  try {
    const order = await Order.findOne({ Partner: partnerId, _id: orderId });

    if (!order) {
      return res.status(500).json({ message: "order not belongs to this partner" });
    }

    if (order.Status === status) {
      return res.status(200).json({ message: "This is your current status" });
    }

    await Order.findByIdAndUpdate(orderId, { Status: status }, { new: true });
    return res.status(200).json({ message: "order status changes" });

    return res.status(200).json(orders);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});


module.exports = router;
