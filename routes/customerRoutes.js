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
} = require("../models");
const checkCustomer = require("../middleware/AuthCustomer");
const { isEmail, isStrong } = require("../libs/checkLib");
const tokenService = require("../services/token-service");
const { hashpassword } = require("../libs/passwordLib");
const { handelSuccess, handelValidationError, handelServerError, handelNoteFoundError } = require('../libs/response-handler/handlers')

const {
  orderStatusTypes,
  orderTypes,
  paymentModeTypes,
  paymentStatus,
  orderStatusTypesObj,
} = require("../enums/types");
const commonFunction = require("../utils/commonFunction");
const { generateRandomReferralCode } = require("../libs/commonFunction");
const Payment = require("../libs/payments/Payment");
const { encodeImage } = require("../libs/imageLib");

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
      return handelSuccess(res, { message: "OTP has been sent successfully", otp: otp });
    } catch (error) {
      return handelServerError(res, { message: "Error encountered while trying to send otp " });
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
        return handelValidationError(res, resp)
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
      return handelServerError(res, { message: "Error encountered while trying to verify otp " });
    }
  }
);


/**
 * middleware to check if customer has access to perform following actions
 */
//router.use(checkCustomer);

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
          return handelValidationError(res, { message: "password is not strong enough." });
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
      return handelValidationError(res, { message: "user updated successfully." });
    } catch (error) {
      return handelServerError(res, { message: "Error encountered while trying to update user." });
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
      return handelValidationError(res, { message: "address field not found." });
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
    return handelValidationError(res, { message: "phone not allowed" })
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
 *                      type: string
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
    const { OrderType, Items, PaymentMode, address, PickUpRequired } = req.body;
    const OrderId = commonFunction.genrateID("ORD");
    let Amount = 0;
    let grandTotal = 0;

    Items.map((element) => (Amount += element?.Cost));
    grandTotal = Amount;

    try {
      let resp = { message: "Orders created successfully." };
      if (PaymentMode === "cod") {
        const newOrder = new Order({
          Customer: req.Customer._id,
          OrderId,
          OrderType,
          Status: orderStatusTypesObj["Requested"],
          PendingAmount: Amount,
          paidamount: Amount,
          PaymentStatus: paymentStatus[1],
          OrderDetails: { Amount, Items },
          PaymentMode,
          address,
          PickUpRequired,
        });
        resp.order = await newOrder.save();
        // deduct commission from partner
      } else if (PaymentMode === "online") {
        // initiate payments process
        const newOrder = new Order({
          Customer: req.Customer._id,
          OrderId,
          OrderType,
          Status: orderStatusTypesObj["Requested"],
          PendingAmount: Amount,
          PaymentStatus: paymentStatus[1],
          OrderDetails: { Amount, Gradtotal: grandTotal, Items },
          PaymentMode,
          address,
          PickUpRequired,
        });
        const customer = await Customer.findById(req.Customer._id);

        let cashfree = await Payment.createCustomerOrder({
          customerid: customer._id,
          email: customer.email,
          phone: customer.phone,
          OrderId,
          Amount,
        });
        resp.order = await newOrder.save();
        resp.cashfree = cashfree;
      }

      // send notifications to all partners
      return handelSuccess(res, { data: resp });
    } catch (error) {
      return handelServerError(res, { message: "Error encountered" });
    }
  }
);

/**
 * @openapi
 * /customer/reestimate:
 *  post:
 *    summary: it's use to re estimated order.
 *    tags:
 *    - Customer Routes
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
router.post("/reestimate", rejectBadRequests, async (req, res) => {
  const { OrderId, Items } = req.body;

  if (!OrderId || Items.length === 0) {
    handelNoteFoundError(res, { message: "please provide OrderId and Items" });
  }

  const consumerId = req.Customer._id;
  let Amount = 0;
  let grandTotal = 0;

  Items.map((element) => (Amount += element?.Cost));
  grandTotal = Amount;

  try {
    const isorderExists = await Order.findOne({
      Customer: consumerId,
      _id: OrderId,
    });
    if (!isorderExists) {
      handelNoteFoundError(res, { message: "order not found" });
    }

    await Order.findOneAndUpdate(
      { _id: OrderId, Customer: consumerId },
      {
        $inc: { "OrderDetails.Gradtotal": grandTotal },
        $inc: { "OrderDetails.Amount": Amount },
        $push: { "OrderDetails.Items": [...Items] },
      },
      { new: true }
    );

    return handelSuccess(res, { message: "Orders successfully reestimated." });
  } catch (error) {
    console.log(error);
    return handelServerError(res, { message: "Error encountered" });
  }
});

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
      handelValidationError(res, { message: "order id is required" });
    }
    const resp = await Payment.verifyCustomerOrder(req.body.order_id);
    return handelSuccess(res, { data: resp });
  } catch (error) {
    return handelServerError(res, { message: "Error encountered" });
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
  const orderStatusTypes = ["Initial", "Requested"];

  try {
    const isOrdrrBelongs = await Order.find({ _id: id, Customer });

    if (!orderStatusTypes.includes(isOrdrrBelongs.Status)) {
      handelValidationError(res, { message: "This order can't be Cancelled" })
    }

    if (!isOrdrrBelongs) {
      handelValidationError(res, { message: "This order not belongs to you" })
    }


    await Order.findByIdAndUpdate(
      isOrdrrBelongs._id,
      { Status: orderStatusTypesObj.Cancelled },
      { new: true }
    );
    return handelSuccess(res, { message: "Orders Cancelled successfully" });
  } catch (error) {
    return handelServerError(res, { message: "Error encountered" });
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
    handelValidationError(res, { message: "Invalid status" });
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
      .populate("OrderDetails.Items.ModelId");

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


router.get("/order", async(req,res) => {
  try{
  let{
    query: {orderId},
    Customer:{_id}
  } = req;

  // const foundUser = await Customer.findById({_id})
  // if(!foundUser){ return res.status(404).send('User does not exist')}

    const foundOrder = await Order.findOne({ Customer: _id, _id: orderId })
      .populate("OrderDetails.Items.ServiceId")
      .populate("OrderDetails.Items.CategoryId")
      .populate("OrderDetails.Items.ModelId");

    if (!foundOrder) {
      handelNoteFoundError(res, { message: "No orders found" });
    }
    return handelSuccess(res, { data: foundOrder, message: "Orders found" });
  }
  catch (err) {
    return handelServerError(res, { message: "An error occured" });
  }
})


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
 *    security:
 *    - bearerAuth: []
 */

router.get("/category", async(req,res) => {
  try{
  let{
    query: {categoryId},
  } = req;

  const foundSubcategory = await SubCategory.findOne({category:categoryId})
  if(!foundSubcategory) { return res.status(404).send('No subcategories found')}

  return res.send({
    status: 200,
    message: "subcategories found",
    data: foundSubcategory
  })}
  catch(err){
    console.log("An error occured",err);
    return res.send({
      status: 500,
      message: "An error occured",
    })
  }
})



module.exports = router;
