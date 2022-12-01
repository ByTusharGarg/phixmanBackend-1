const router = require("express").Router();
const { rejectBadRequests } = require("../middleware");
const { body } = require("express-validator");
const { generateOtp, sendOtp } = require("../libs/otpLib");
const {
  Customer,
  Order,
  SubCategory,
  Partner,
  Counters,
  CustomerWallet,
  category,
  Coupon,
  ClaimRequest,
  refundModel,
} = require("../models");
const checkCustomer = require("../middleware/AuthCustomer");
const moment = require("moment");
const { isEmail, isStrong } = require("../libs/checkLib");
const tokenService = require("../services/token-service");
const { hashpassword } = require("../libs/passwordLib");
const {
  handelSuccess,
  handelValidationError,
  handelServerError,
  handelNoteFoundError,
} = require("../libs/response-handler/handlers");

const {
  orderStatusTypes,
  orderTypes,
  paymentModeTypes,
  paymentStatus,
  orderStatusTypesObj,
} = require("../enums/types");

const {
  claimTypesList
} = require('../enums/claimTypes')
const commonFunction = require("../utils/commonFunction");
const { generateRandomReferralCode } = require("../libs/commonFunction");
const Payment = require("../libs/payments/Payment");
const { encodeImage } = require("../libs/imageLib");
const { randomImageName, uploadFile, uploadFileToS3 } = require("../services/s3-service");

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

const updateUserValidator = [
  body("email").isEmail().withMessage("email is invalid"),
  body("Password").isString().withMessage("password should be a string"),
];

const verifyOrderValidator = [
  body("OrderType")
    .notEmpty()
    .withMessage("OrderType number cannot be empty")
    .isIn(orderTypes)
    .withMessage("OrderType does contain invalid value"),
  body("PaymentMode")
    .notEmpty()
    .withMessage("PaymentMode number cannot be empty")
    .isIn(paymentModeTypes)
    .withMessage("PaymentMode does contain invalid value"),
  body("PickUpRequired")
    .isBoolean()
    .withMessage("PickUpRequired Must be a boolean true or false"),
  body("Items").isArray().withMessage("Items should be an array"),
];

/**
 * @openapi
 * /customer/SendOTP:
 *  post:
 *    summary: request server to genrate and send otp on given number.
 *    tags:
 *    - Customer Routes
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
      //check if customer with given number exists and update otp in db, else create new customer.
      const isuserExist = await Customer.findOne({ phone: req?.body?.phone });
      if (isuserExist) {
        await Customer.findOneAndUpdate(
          { phone: req?.body?.phone },
          { otp: { code: otp, status: "active" } },
          { new: true }
        );
        //send otp to user
        // sendOtp(isuserExist.phone, otp);
      } else {
        const newuser = new Customer({
          Sno: commonFunction.genrateID("C"),
          phone: req?.body?.phone,
          isExistingUser: false,
          otp: { code: otp, status: "active" },
          uniqueReferralCode: generateRandomReferralCode(),
        });
        await newuser.save();
        //send otp to user
      }
      sendOtp(req?.body?.phone, otp);
      return handelSuccess(res, {
        message: "OTP has been sent successfully",
        otp: otp,
      });
    } catch (error) {
      return handelServerError(res, {
        message: "Error encountered while trying to send otp ",
      });
    }
  }
);

/**
 * @openapi
 * /customer/VerifyOTP:
 *  post:
 *    summary: used to verify otp provided by user.
 *    tags:
 *    - Customer Routes
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
    let resp = {};

    try {
      const customer = await Customer.findOneAndUpdate(
        {
          phone: req?.body?.phone,
          "otp.code": req?.body?.otp,
          "otp.status": "active",
        },
        { "otp.status": "inactive" },
        { new: true }
      );

      if (customer === null) {
        return handelValidationError(res, { message: "Invalid OTP" });
      }

      if (!customer.isVerified) {
        // This condition runs when customer login first time
        const up = await Customer.findOneAndUpdate(
          { phone: req?.body?.phone },
          {
            "otp.code": req?.body?.otp,
            "otp.status": "active",
            isVerified: true,
          },
          { new: true }
        );

        // generate customer wallet
        const isWalletExists = await CustomerWallet.findOne({
          customerId: customer?._id,
        });
        if (!isWalletExists) {
          const newWallet = new CustomerWallet({ customerId: customer?._id });
          await newWallet.save();
        }
      }

      if (!customer.isPublished) {
        resp["message"] =
          "Account block contact admin . please wait for approval.";
      }

      if (resp.message) {
        return handelValidationError(res, resp);
      } else {
        const { accessToken, refreshToken } = tokenService.generateAuthTokens(
          { _id: customer._id, isPublished: customer.isPublished },
          process.env.JWT_SECRET_ACCESS_TOKEN
        );
        return handelSuccess(res, {
          message: "Login successfully",
          uid: customer._id,
          isExistingUser: customer.isExistingUser,
          accessToken: accessToken,
          refreshToken: refreshToken,
          isApproved: customer.isApproved,
        });
      }
    } catch (error) {
      return handelServerError(res, {
        message: "Error encountered while trying to verify otp ",
      });
    }
  }
);

/**
 * @openapi
 * /customer/category:
 *  get:
 *    summary: using this route user can get subcategories
 *    tags:
 *    - Customer Routes
 *    parameters:
 *      - in: query
 *        name: categoryId
 *        required: true
 *        schema:
 *           type: string
 *
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
 */

router.get("/category", async (req, res) => {
  try {
    let {
      query: { categoryId },
    } = req;

    const foundSubcategory = await SubCategory.find({ category: categoryId });
    if (!foundSubcategory) {
      return res.status(404).send("No subcategories found");
    }

    return handelSuccess(res, {
      data: foundSubcategory,
      message: "subcategories found",
    });
  } catch (err) {
    console.log("An error occured", err);
    return res.send({
      status: 500,
      message: "An error occured",
    });
  }
});

/**
 * @openapi
 * /customer/timeslots:
 *  get:
 *    summary: using this route user can get timeslots
 *    tags:
 *    - Customer Routes
 *    parameters:
 *      - in: query
 *        name: categoryId
 *        required: true
 *        schema:
 *           type: string
 *
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
 */
router.get("/timeslots", async (req, res) => {
  try {
    let {
      query: { categoryId },
    } = req;
    const foundTimeSlots = await category
      .findById({ _id: categoryId })
      .select("Slots");
    if (!foundTimeSlots) return res.status(404).send("No Timeslots found");
    return handelSuccess(res, {
      data: foundTimeSlots,
      message: "Timeslots found",
    });
  } catch (err) {
    console.log("An error occured", err);
    return res.send({
      status: 500,
      message: "An error occured",
    });
  }
});

// refund webhook
router.post("/webhook/refund", async (req, res) => {
  console.log(req.body);
  const {
    type,
    data: {
      refund: { refund_id, refund_status, refund_amount, order_id },
    },
  } = req.body;

  if (type !== "REFUND_STATUS_WEBHOOK") {
    return res.status(400).json({ message: "not as cashfree request" });
  }
  try {
    // {
    //   data: {
    //     refund: {
    //       cf_payment_id: 1234,
    //       cf_refund_id: 34198,
    //       created_at: '2022-02-23T15:27:26+05:30',
    //       entity: 'Refund',
    //       metadata: null,
    //       order_id: '3hD-hgxkW27',
    //       processed_at: '2022-02-23T15:28:36+05:30',
    //       refund_amount: 5,
    //       refund_arn: '123356',
    //       refund_charge: 0,
    //       refund_currency: 'INR',
    //       refund_id: 'REF_1645610245762635',
    //       refund_mode: 'STANDARD',
    //       refund_note: 'triggered by CashFree',
    //       refund_splits: null,
    //       refund_status: 'SUCCESS',
    //       refund_type: 'MERCHANT_INITIATED',
    //       status_description: 'Refund processed successfully'
    //     }
    //   },
    //   type: 'REFUND_WEBHOOK',
    //   event_time: '2022-02-23T15:28:36+05:30'
    // }
    const resp = await refundModel.findOneAndUpdate({ refundId: refund_id, "caashfreeData.refund_amount": refund_amount }, req.body.data.refund, { new: true });
    if (resp) {
      return res.status(200).json({ message: "thanks cashfree for notify us" });
    } else {
      return res.status(400).json({ message: "nnot found" });
    }
  } catch (error) {
    console.log(error);
    return handelServerError(res, {
      message: "Error encountered while trying to update user.",
    });
  }
});

/**
 * middleware to check if customer has access to perform following actions
 */

router.use(checkCustomer);

/**
 * @openapi
 * /customer:
 *  patch:
 *    summary: used to update user data.
 *    tags:
 *    - Customer Routes
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
 *                image:
 *                  type: file
 *                gender:
 *                  type: string
 *                  enum: ["male", "female", "non-binary"]
 *          encoding:
 *              image:
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
  ...updateUserValidator,
  rejectBadRequests,
  async (req, res) => {
    try {
      let update = req?.body;
      if (req?.body?.email && req?.body?.email === "") {
        update.email = req?.body?.email.toLowerCase();
      }
      if (req?.body?.Password && req?.body?.Password === "") {
        if (!isStrong(req?.body?.Password)) {
          return handelValidationError(res, {
            message: "password is not strong enough.",
          });
        }
        update.Password = hashpassword(req?.body?.Password);
      }
      if (req?.files?.image) {
        console.log(req.files.image);
        update.image = encodeImage(req.files.image);
      }
      const customer = await Customer.findByIdAndUpdate(
        req.Customer._id,
        update,
        { new: true }
      );
      return handelValidationError(res, {
        message: "user updated successfully.",
      });
    } catch (error) {
      return handelServerError(res, {
        message: "Error encountered while trying to update user.",
      });
    }
  }
);

/**
 * @openapi
 * /customer:
 *  get:
 *    summary: gets user details.
 *    tags:
 *    - Customer Routes
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
  console.log(req?.Customer);
  return handelSuccess(res, { data: req?.Customer });
});

/**
 * @openapi
 * /customer/address:
 *  post:
 *    summary: successfully added new address for the user.
 *    tags:
 *    - Customer Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                address:
 *                  type: object
 *                  properties:
 *                   street:
 *                    type: string
 *                   city:
 *                    type: string
 *                   pin:
 *                    type: string
 *                   state:
 *                    type: string
 *                   type:
 *                    type: string
 *                   cood:
 *                    type: object
 *                    properties:
 *                     lattitude:
 *                      type: string
 *                     longitude:
 *                      type: string
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
router.post("/address", async (req, res) => {
  try {
    if (!req?.body?.address || Object.keys(req?.body?.address).length === 0) {
      return handelValidationError(res, {
        message: "address field not found.",
      });
    }
    await Customer.findByIdAndUpdate(
      req.Customer._id,
      {
        $push: { address: req?.body?.address },
      },
      { new: true }
    );
    return handelSuccess(res, { message: "address added" });
  } catch (error) {
    return handelServerError(res, { message: "Error encountered" });
  }
});

/**
 * @openapi
 * /customer/updateprofile:
 *  patch:
 *    summary: sUpdate consumer profile
 *    tags:
 *    - Customer Routes
 *    requestBody:
 *      content:
 *        multipart/form-data:
 *          schema:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                Name:
 *                  type: string
 *                Password:
 *                  type: string
 *                image:
 *                  type: file
 *                fcmToken:
 *                  type: string
 *                gender:
 *                  type: string
 *                  enum: ["male", "female", "non-binary"]
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
router.patch("/updateprofile", async (req, res) => {
  const cid = req.Customer._id;
  if (req.body.phone) {
    return handelValidationError(res, { message: "phone not allowed" });
  }

  let updateQuery = req.body;
  try {
    const getUserProfile = await Customer.findById(cid);
    if (req?.files?.image) {
      console.log(req.files.image);
      updateQuery.image = encodeImage(req.files.image);
    }
    if (getUserProfile.isExistingUser === false) {
      updateQuery["isExistingUser"] = true;
    }
    await Customer.findByIdAndUpdate(cid, updateQuery);
    return handelSuccess(res, { message: "Profile updated successfully" });
  } catch (error) {
    return handelServerError(res, { message: "Error encountered" });
  }
});

/**
 * @openapi
 * /customer/address:
 *  get:
 *    summary: gets all the saved addresses for the user.
 *    tags:
 *    - Customer Routes
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
router.get("/address", async (req, res) => {
  return handelSuccess(res, { address: req?.Customer?.address });
});

/**
 * @openapi
 * /customer/create/order:
 *  post:
 *    summary: it's use to create a requested new order to partner.
 *    tags:
 *    - Customer Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                OrderType:
 *                  type: string
 *                  enum: ["Visit Store", "Home Visit", "Pick & Drop"]
 *                timeSlot:
 *                  type: object
 *                  properties:
 *                    day:
 *                      type: string
 *                    time:
 *                      type: object
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
 *                PaymentMode:
 *                  type: string
 *                  enum: [cod,online]
 *                address:
 *                  type: object
 *                  properties:
 *                    street:
 *                      type: string
 *                    city:
 *                      type: string
 *                    pin:
 *                      type: string
 *                    state:
 *                      type: string
 *                    country:
 *                      type: string
 *                    cod:
 *                      type: object
 *                      properties:
 *                         lattitude:
 *                           type: string
 *                         longitude:
 *                            type: string
 *                PickUpRequired:
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
 *    security:
 *    - bearerAuth: []
 */
router.post(
  "/create/order",
  verifyOrderValidator,
  rejectBadRequests,
  async (req, res) => {
    const { OrderType, Items, PaymentMode, address, PickUpRequired, timeSlot } =
      req.body;
    const OrderId = commonFunction.genrateID("ORD");
    let Amount = 0;
    let grandTotal = 0;

    Items.map((element) => (Amount += element?.Cost));
    grandTotal = Amount;

    try {
      let resp = { message: "Orders created successfully." };
      if (PaymentMode === "cod") {
        const newOrder = await Order.create({
          Customer: req.Customer._id,
          OrderId,
          OrderType,
          Status: orderStatusTypesObj.Requested,
          PendingAmount: Amount,
          PaymentStatus: paymentStatus[1],
          OrderDetails: { Amount, Gradtotal: grandTotal, Items },
          PaymentMode,
          address,
          PickUpRequired,
          timeSlot,
        });
        resp.order = newOrder;
        // deduct commission from partner
      } else if (PaymentMode === "online") {
        const customer = await Customer.findById(req.Customer._id);
        // initiate payments process   
        let cashfree = await Payment.createCustomerOrder({
          // ourorder_id: newOrder._id,
          customerid: customer._id,
          email: customer.email,
          phone: customer.phone,
          OrderId,
          Amount,
        });
        const newOrder = await Order.create({
          Customer: req.Customer._id,
          OrderId,
          OrderType,
          Status: orderStatusTypesObj.Initial,
          PendingAmount: Amount,
          PaymentStatus: paymentStatus[1],
          OrderDetails: { Amount, Gradtotal: grandTotal, Items },
          PaymentMode,
          address,
          PickUpRequired,
          timeSlot,
        });
        resp.order = newOrder;
        resp.cashfree = cashfree;
      }

      // send notifications to all partners
      return handelSuccess(res, resp);
    } catch (error) {
      // console.log(error.message);
      return handelServerError(res, {
        message: error?.message || "Error encountered",
      });
    }
  }
);

/**
 * @openapi
 * /customer/verifyOrderStatus:
 *   post:
 *    summary: it's use to verify order payment status.
 *    tags:
 *    - Customer Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                order_id:
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
router.post("/verifyOrderStatus", async (req, res) => {
  try {
    if (!req.body.order_id) {
      return handelValidationError(res, { message: "order id is required" });
    }
    const resp = await Payment.verifyCustomerOrder(req.body.order_id);
    return handelSuccess(res, { data: resp });
  } catch (error) {
    return handelServerError(res, {
      message: error?.message || "Error encountered",
    });
  }
});

/**
 * @openapi
 * /customer/cancel:
 *   post:
 *    summary: it's use to cancel the order.
 *    tags:
 *    - Customer Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                id:
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
router.post("/cancel", async (req, res) => {
  const { id } = req.body;
  const Customer = req.Customer._id;
  const orderStatusTypes = ["Initial", "Requested", "Accepted"];

  try {
    const isOrdrrBelongs = await Order.findOne({ _id: id, Customer }).populate(
      "TxnId"
    );

    if (!isOrdrrBelongs) {
      return handelValidationError(res, {
        message: "This order not belongs to you",
      });
    }

    if (!orderStatusTypes.includes(isOrdrrBelongs.Status)) {
      return handelValidationError(res, {
        message: "This order can't be Cancelled",
      });
    }

    //  all cod order cancel
    if (isOrdrrBelongs.PaymentMode === "cod") {
      await Order.findByIdAndUpdate(
        isOrdrrBelongs._id,
        { Status: orderStatusTypesObj.Cancelled },
        { new: true }
      );
      return handelSuccess(res, { message: "Orders Cancelled successfully" });
    }

    // online initial order cancel
    if (
      isOrdrrBelongs.PaymentMode === "online" &&
      isOrdrrBelongs.Status === orderStatusTypesObj.Initial &&
      isOrdrrBelongs.TxnId.length === 0
    ) {
      await Order.findByIdAndUpdate(
        isOrdrrBelongs._id,
        { Status: orderStatusTypesObj.Cancelled },
        { new: true }
      );
      return handelSuccess(res, {
        message: "initial Orders Cancelled successfully",
      });
    }

    // all online payment order Accepted cases

    if (isOrdrrBelongs.TxnId.length === 0) {
      return handelValidationError(res, {
        message: "no transaction found for this order",
      });
    }

    if (isOrdrrBelongs.TxnId.length > 1) {
      return handelValidationError(res, {
        message: "more then 1 transsaction found for this can't cancel",
      });
    }

    const transData = isOrdrrBelongs.TxnId[0];
    // console.log(transData);

    // if in requested state refund all payments
    if (isOrdrrBelongs.Status === orderStatusTypesObj.Requested) {
      await Payment.initiateRefundPayments(
        transData.cashfreeOrderId,
        transData.order_amount,
        { orderId: id }
      );
    }

    let acceptTimeStamp = isOrdrrBelongs.statusLogs.filter(
      (ele) => ele.status === orderStatusTypesObj.Accepted
    );
    acceptTimeStamp = acceptTimeStamp[0];
    // console.log(acceptTimeStamp);

    const dbDate = new Date(acceptTimeStamp.timestampLog);
    let currentDate = new Date();

    currentDate.setHours(currentDate.getHours() + 2);

    if (
      isOrdrrBelongs.Status === orderStatusTypesObj.Accepted &&
      dbDate.getTime() < currentDate.getTime()
    ) {
      // if in the accepted state but less then 2h refund all amount
      // console.log('all amt');
      await Payment.initiateRefundPayments(
        transData.cashfreeOrderId,
        transData.order_amount,
        { orderId: id }
      );
    } else if (
      isOrdrrBelongs.Status === orderStatusTypesObj.Accepted &&
      dbDate.getTime() > currentDate.getTime()
    ) {
      // if more the 2hr deduct some amount
      // console.log('less');
      await Payment.initiateRefundPayments(
        transData.cashfreeOrderId,
        transData.order_amount - process.env.REFUND_AMOUNT,
        { orderId: id }
      );
    } else {
      return handelValidationError(res, { message: "unable too cancel order" });
    }

    return handelSuccess(res, {
      message: "Orders Cancelled successfully refund iniitiated",
    });
  } catch (error) {
    console.log(error);
    return handelServerError(res, {
      message: error.message || "Error encountered",
    });
  }
});

/**
 * @openapi
 * /customer/myorders/{status}:
 *  get:
 *    summary: using this route user can get all orders of his/her.
 *    tags:
 *    - Customer Routes
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
  const Customer = req.Customer._id;

  if (status !== "all" && !orderStatusTypes.includes(status)) {
    return handelValidationError(res, { message: "Invalid status" });
  }

  let query = { Customer };

  if (status !== "all") {
    query["Status"] = status;
  }

  try {
    const orders = await Order.find(query)
      .populate("Partner", "Name")
      .populate("Customer", "Name")
      .populate("OrderDetails.Items.ServiceId")
      .populate("OrderDetails.Items.CategoryId")
      .populate("OrderDetails.Items.ModelId")
      .sort({ createdAt: -1 });

    return handelSuccess(res, { data: orders });
  } catch (error) {
    return handelServerError(res, { message: "Error encountered" });
  }
});

/**
 * @openapi
 * /customer/order:
 *  get:
 *    summary: using this route user can get a specific orders by id.
 *    tags:
 *    - Customer Routes
 *    parameters:
 *      - in: query
 *        name: orderId
 *        required: true
 *        schema:
 *           type: string
 *
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

router.get("/order", async (req, res) => {
  try {
    let {
      query: { orderId },
      Customer: { _id },
    } = req;

    // const foundUser = await Customer.findById({_id})
    // if(!foundUser){ return res.status(404).send('User does not exist')}

    const foundOrder = await Order.findOne({ Customer: _id, _id: orderId })
      .populate("Partner", "Name email phone profilePic")
      .populate("OrderDetails.Items.ServiceId")
      .populate("OrderDetails.Items.CategoryId")
      .populate("OrderDetails.Items.ModelId");

    if (!foundOrder) {
      return handelNoteFoundError(res, { message: "No orders found" });
    }
    return handelSuccess(res, { data: foundOrder, message: "Orders found" });
  } catch (err) {
    return handelServerError(res, { message: "An error occured" });
  }
});

/**
 * @openapi
 * /customer/active-offers:
 *   get:
 *    summary: it's used to fetch all active orders.
 *    tags:
 *    - Customer Routes
 *    responses:
 *      200:
 *          description: if we are able to fetch all active offers
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

router.get("/active-offers", async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const currentTime = moment().format();

    let foundActiveOffer = await Coupon.find({ startDate: { $lte: today }, endDate: { $gte: today }, isActive: true, startTime: { $lte: currentTime }, endTime: { $gte: currentTime } }).lean();

    if (foundActiveOffer.length === 0) return res.status(400).json({ message: 'No active offers found' })

    return res.status(200).json({ message: "active offers found", data: foundActiveOffer })
  } catch (err) {
    return handelServerError(res, { message: "An error occured" });
  }
})


/**
 * @openapi
 * /customer/create/claim:
 *  post:
 *    summary: used to create claims
 *    tags:
 *    - Customer Routes
 *    requestBody:
 *     content:
 *       multipart/form-data:
 *        schema:
 *          type: object
 *          properties:
 *            orderId:
 *              type: string
 *              required: true
 *            title:
 *              type: string
 *              required: true
 *            description:
 *              type: string
 *              required: true
 *            images:
 *              type: array
 *              items:
 *                type: file
 *            audio:
 *              type: file
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
router.post("/create/claim", async (req, res) => {
  try {
    const {
      body: {
        orderId,
        title,
        description,
      }
    } = req

    let imageMedia = [],fileName=[];
     let audioMedia = []


    //console.log(req.files,req.files.images.length);

    if (req.files?.audio){
      audioMedia.push({...req.files?.audio, fileName:randomImageName()});
      let audioURL = await uploadFileToS3(audioMedia[0]?.data,audioMedia[0]?.name,audioMedia[0]?.mimetype )
      console.log('Audio URL',audioURL);
    }

    if(req.files?.images?.length > 0){

      req.files?.images?.forEach((pic)=>{
        imageMedia.push({...pic, fileName:randomImageName()})
      })
    } else{
      imageMedia.push({...req.files?.images, fileName:randomImageName()})
    }  
    console.log("****",imageMedia)
    await Promise.all(
      imageMedia.map((file, i) => {
        if (file) {
          fileName.push(file.fileName)
          console.log(file)
          return uploadFile(file.data, file.fileName, file.mimetype);
        } else {
          return;
        }
      })
    );

    const claimId = commonFunction.genrateID("CLAIM");
    const customerId = req.Customer._id;

    const claimObj = {
      claimId,
      customerId,
      orderId,
      title,
      description,
      voiceNote: audioMedia[0]?.fileName,
      images: imageMedia.length > 1 ? fileName : imageMedia[0].fileName,
    }

    const newClaim = await ClaimRequest.create(claimObj)
    if(!newClaim) return res.status(400).json({message:"Unable to create claim"})

    return res.status(200).json({message:"New claim created", data:newClaim})


  } catch (error) {
    console.log('$$$$$$$$$',error);
    return res.status(500).json({
      message: "Error encountered while trying to create claim.",
    });
  }

})

/**
 * @openapi
 * /customer/delete-account:
 *  delete:
 *    summary: used to delete account
 *    tags:
 *    - Customer Routes
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

router.delete("/delete-account", async(req,res)=>{
  try{
    const Customer1 = req.Customer._id;

  const deleteUser = await Customer.findOneAndUpdate(
    {_id:Customer1},
    {
      $set:{
      Name:'Anonymous User',
      email:'anonymous email',
      address:null,
      phone:""    
    }
  }
  )

  if(!deleteUser) return res.status(400).json({message:"Unable to delete user"})
  return res.status(200).json({ message: "User deleted successfully" })
}catch (error) {
  console.log('$$$$$$$$$',error);
  return res.status(500).json({
    message: "Error encountered while trying to create claim.",
  });
}


})







module.exports = router;
