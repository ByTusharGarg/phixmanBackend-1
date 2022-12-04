const router = require("express").Router();
const { AdminAuth } = require("../middleware");
const moment = require("moment");
const {
  Admin,
  Customer,
  Partner,
  Coupon,
  Order,
  WalletTransaction,
  category,
  CustomerWallet,
  Product_Service,
  SystemInfo,
  Model,
  Brand,
  Country,
  State,
  City,
  Zone,
  Notification,
  SubCategory,
  orderTransaction,
  Invoice,
  Vendor,
} = require("../models");
const PenalitySchema = require("../models/penality");
const {
  getAllWallletTranssactionForUser,
  getCustomerWallet,
} = require("../services/Wallet");
//const commonFunction = require("../utils/commonFunction");
const { checkAdmin } = require("../middleware/AuthAdmin");
const { rejectBadRequests } = require("../middleware");
const { encodeImage } = require("../libs/imageLib");
const Feature = require("../models/Features");
const commonFunction = require("../utils/commonFunction");
const { trim, escapeRegExp } = require("lodash");
const {
  paymentStatus,
  orderTypes,
  paymentModeTypes,
  orderStatusTypesObj,
  payoutStatusTypes,
} = require("../enums/types");
const { body } = require("express-validator");
const { makePartnerTranssaction } = require("./walletRoute");
const { randomImageName, uploadFile } = require("../services/s3-service");
const { updatePassword } = require("../middleware/AuthAdmin");
const path = require("path");
const csv = require("csvtojson");
const fs = require("fs");
const {
  getParseModels,
  generateRandomReferralCode,
} = require("../libs/commonFunction");
const { adminTypeArray } = require("../enums/adminTypes");
const { getWalletTransactions } = require("../services/Wallet");
const Payouts = require("../libs/payments/payouts");

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

// const verifyCustomerId = [
//   query("customerId")
//       .notEmpty()
//       .withMessage("Customer Id is required"),
// ]

/**
 * @openapi
 * /admin/Register:
 *  post:
 *    summary: used to register new admin.
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                email:
 *                  type: string
 *                pswd:
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
 */
router.post("/Register", AdminAuth.registerAdmin);

/**
 * @openapi
 * /admin/Login:
 *  post:
 *    summary: used to login on admin portal.
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                username:
 *                  type: string
 *                  example: devops@phixman.in
 *                password:
 *                  type: string
 *                  example: admin123
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
router.post("/Login", AdminAuth.adminLogin);

/**
 * @openapi
 * /admin/resetpassword:
 *  post:
 *    summary: used to send reset password link to the admin
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                email:
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
 */
router.post("/resetpassword", AdminAuth.resetPassword);

/**
 * @openapi
 * /admin/changepassword:
 *  post:
 *    summary: used to change admin password
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                token:
 *                  type: string
 *                newpassword:
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
 */
router.post("/changepassword", AdminAuth.changePassword);

router.use(AdminAuth.checkAdmin);

/**
 * @openapi
 * /admin/createadmin:
 *  post:
 *    summary: used to create new admin by superadmmin.
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                email:
 *                  type: string
 *                zones:
 *                  type: array
 *                  items:
 *                    type: string
 *                    example: 630a2cd91fb0df4a3cb75593
 *                category:
 *                  type: array
 *                  items:
 *                    type: string
 *                    example: 630a2cd91fb0df4a3cb75593
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
router.post("/createadmin", AdminAuth.createAdmin);

/**
 * @openapi
 * /admin/createsubadmin:
 *  post:
 *    summary: used to create new subadmin admin by superadmmin.
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                email:
 *                  type: string
 *                zones:
 *                  type: array
 *                  items:
 *                    type: string
 *                    example: 630a2cd91fb0df4a3cb75593
 *                category:
 *                  type: array
 *                  items:
 *                    type: string
 *                    example: 630a2cd91fb0df4a3cb75593
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
router.post("/createsubadmin", AdminAuth.createSubAdmin);

/**
 * @openapi
 * /admin/alladmin:
 *  post:
 *    summary: used to fetch list of admins
 *    tags:
 *    - Admin Routes
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
router.get("/alladmin", async (req, res) => {
  try {
    const foundAdmin = await Admin.find().lean();
    if (foundAdmin.length === 0)
      return res.status(400).json({ message: "No Admin found" });

    return res.status(200).json({ message: "Admins found", data: foundAdmin });
  } catch (error) {
    return res.status(500).json({
      message: "Error encountered while trying to change offer status.",
    });
  }
});

/**
 * @openapi
 * /admin:
 *  get:
 *    summary: used to list all admins.
 *    tags:
 *    - Admin Routes
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
router.get("/", async (req, res) => {
  try {
    const admins = await Admin.find({}, { password: 0 });
    return res.status(200).json(admins);
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/session:
 *  get:
 *    summary: used to check if session is active or not.
 *    tags:
 *    - Admin Routes
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
router.get("/session", (req, res) => {
  return res.status(200).json({ message: "session is active" });
});

/**
 * @openapi
 * /admin/updatepassword:
 *  patch:
 *    summary: used to update admin password after login
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                newpassword:
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
router.patch("/updatepassword", updatePassword);

/**
 * @openapi
 * /admin/customer/create:
 *  post:
 *    summary: request server to add a new customer.
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                phone:
 *                  type: string
 *                  example: 9958497352
 *                Name:
 *                  type: string
 *                  example: Test User
 *                email:
 *                  type: string
 *                  example: example@phixman.in
 *                gender:
 *                  type: string
 *                  enum: ["male", "female", "non-binary"]
 *                address:
 *                  type: object
 *                  properties:
 *                   street:
 *                    type: string
 *                    example: vikaspuri
 *                   city:
 *                    type: string
 *                    example: New Delhi
 *                   pin:
 *                    type: string
 *                    example: 110018
 *                   state:
 *                    type: string
 *                    example: Delhi
 *                   country:
 *                    type: string
 *                    example: India
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
router.post("/customer/create", async (req, res) => {
  if (!req?.body?.phone || req.body.phone.length < 10) {
    return res.status(200).json({ message: "invalid number or required" });
  }
  try {
    //check if customer with given number exists and update otp in db, else create new customer.
    const isuserExist = await Customer.findOne({ phone: req?.body?.phone });
    if (isuserExist) {
      return res
        .status(403)
        .json({ message: "Customer number already exists" });
    }
    const newuser = await Customer.create({
      Sno: commonFunction.genrateID("C"),
      phone: req?.body?.phone,
      Name: req?.body?.Name,
      email: req?.body?.email,
      address: req?.body?.address,
      gender: req?.body?.gender,
      isVerified: true,
      isPublished: true,
      isActive: true,
      isExistingUser: true,
      uniqueReferralCode: generateRandomReferralCode(),
    });
    console.log(newuser._id);
    // generate customer wallet
    await CustomerWallet.create({ customerId: newuser?._id });
    return res
      .status(200)
      .json({ message: "Customer created successfully", data: newuser });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error encountered while trying to send otp" });
  }
});

/**
 * @openapi
 * /admin/updatecustomer/{_id}:
 *  patch:
 *    summary: Update consumer profile
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: path
 *        name: _id
 *        required: true
 *        schema:
 *          type: string
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
router.patch("/updatecustomer/:id", async (req, res) => {
  const cid = req.params;

  if (req.body.phone) {
    return handelValidationError(res, { message: "phone not allowed" });
  }

  let updateQuery = req.body;
  try {
    await Customer.findByIdAndUpdate(cid, updateQuery);
    return handelSuccess(res, { message: "Profile updated successfully" });
  } catch (error) {
    return handelServerError(res, { message: "Error encountered" });
  }
});

/**
 * @openapi
 * /admin/customer/search:
 *  get:
 *    summary: This route admin can used to search customer by number
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: query
 *        name: phone
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
router.get("/customer/search", async (req, res) => {
  let { phone } = req.query;

  if (phone && phone?.length < 3) {
    return res
      .status(400)
      .json({ status: true, message: "Should be grater then 3" });
  }
  phone = trim(phone);

  let isPublished = true;

  try {
    const regex = new RegExp(escapeRegExp(phone), "gi");

    const data = await Customer.find({
      $and: [
        {
          $or: [{ phone: regex }],
        },
      ],
      isPublished,
    })
      .sort({
        createdAt: "-1",
      })
      .limit(20)
      .select("phone Name address");

    return res
      .status(200)
      .json({ status: true, message: "customer lists", data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while searching partners",
    });
  }
});

/**
 * @openapi
 * /admin/getCustomers:
 *  get:
 *    summary: used to list all admins.
 *    tags:
 *    - Admin Routes
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
router.get("/getCustomers", async (req, res) => {
  try {
    const customers = await Customer.find({}, { otp: 0 });
    return res.status(200).json(customers);
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/customersorders/{_id}:
 *  get:
 *    summary: using this route admmin can get orders by customer id.
 *    tags:
 *    - Admin Routes
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
router.get("/customersorders/:id", async (req, res) => {
  let { id } = req.params;

  try {
    const orders = await Order.find({ Customer: id })
      .populate("Partner")
      .populate("Customer")
      .populate("OrderDetails.Items.ServiceId")
      .populate("OrderDetails.Items.CategoryId")
      .populate("OrderDetails.Items.ModelId");
    return res.status(200).json(orders);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/create/order:
 *  post:
 *    summary: it's use to create a requested new order to partner.
 *    tags:
 *    - Admin Routes
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
 *                OrderType:
 *                  type: string
 *                  enum: [InStore, Home]
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
 *
 *                PaymentMode:
 *                  type: string
 *                  enum: [cod]
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
 *                  type: srting
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
    const {
      OrderType,
      Items,
      PaymentMode,
      address,
      PickUpRequired,
      customerId,
      partnerId,
    } = req.body;

    if (!partnerId || !customerId) {
      return res
        .status(400)
        .json({ message: "partnerid and customerid are required" });
    }

    const OrderId = commonFunction.genrateID("ORD");
    let Amount = 0;
    let grandTotal = 0;

    Items.map((element) => (Amount += element?.Cost));
    grandTotal = Amount;

    try {
      let resp = {};

      if (PaymentMode !== "cod") {
        return res.status(400).json({ message: "Cod is allowed." });
      }
      const newOrder = new Order({
        Partner: partnerId,
        Customer: customerId,
        OrderId,
        OrderType,
        Status: orderStatusTypesObj["Accepted"],
        PendingAmount: Amount,
        PaymentStatus: paymentStatus[1],
        OrderDetails: { Amount, Items },
        PaymentMode,
        address,
        PickUpRequired,
      });

      resp = await newOrder.save();
      // deduct commission from partner

      return res
        .status(200)
        .json({ message: "Orders created successfully.", newOrder: resp });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Error encountered." });
    }
  }
);

/**
 * @openapi
 * /admin/getOrders:
 *  get:
 *    summary: used to list orders.
 *    tags:
 *    - Admin Routes
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
router.get("/getOrders", async (req, res) => {
  try {
    const orders = await Order.find({}).populate("TxnId");

    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/assignorder:
 *  post:
 *    summary: it's use to assign order to partner
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                orderId:
 *                  type: string
 *                partnerId:
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
router.post("/assignorder", async (req, res) => {
  const { orderId, partnerId } = req.body;
  if (!orderId || !partnerId) {
    return res.status(400).json({ message: "partnerId and  orderId required" });
  }

  try {
    const orderDetails = await Order.findById(orderId);

    if (!orderDetails) {
      return res.status(400).json({ message: "No order found" });
    }

    await Order.findByIdAndUpdate(
      orderId,
      { Partner: partnerId },
      { new: true }
    );
    return res
      .status(200)
      .json({ message: "Order successfully assigned to partner" });
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/Order:
 *  get:
 *    summary: used to get order by id.
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: query
 *        name: id
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
router.get("/Order", async (req, res) => {
  try {
    const orders = await Order.findById(req.query.id);
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/createpartner:
 *  post:
 *    summary: used to create partner
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *     content:
 *       multipart/form-data:
 *        schema:
 *          type: object
 *          properties:
 *            phone:
 *              type: string
 *              required: true
 *            Name:
 *              type: string
 *              required: true
 *            isParent:
 *              type: string
 *              required: true
 *            gender:
 *              type: string
 *              required: true
 *            email:
 *              type: string
 *              required: true
 *            Dob:
 *              type: string
 *              required: true
 *            Type:
 *              type: string
 *              required: true
 *              enum: ["store", "individual", "sub-provider", "specialist"]
 *            Product_Service:
 *              type: string
 *              required: true
 *            panNumber:
 *              type: string
 *              required: true
 *            aadharNumber:
 *              type: string
 *              required: true
 *            bussinessName:
 *              type: string
 *              required: true
 *            workingdays:
 *              type: array
 *              required: true
 *            business_hours:
 *              type: object
 *              required: true
 *              properties:
 *               start_hour:
 *                type: string
 *               end_hour:
 *                type: string
 *            address:
 *              type: object
 *              required: true
 *              properties:
 *               street:
 *                type: string
 *               city:
 *                type: string
 *               pin:
 *                type: string
 *               state:
 *                type: string
 *               country:
 *                type: string
 *               landmark:
 *                type: string
 *               billingAddress:
 *                type: string
 *               address:
 *                type: string
 *               cood:
 *                type: object
 *                properties:
 *                 lattitude:
 *                   type: string
 *                 longitude:
 *                   type: string
 *            secondaryNumber:
 *              type: string
 *            aadharImageF:
 *              type: file
 *              required: true
 *            aadharImageB:
 *              type: file
 *              required: true
 *            pancardImage:
 *              type: file
 *              required: true
 *            gstCertificate:
 *              type: file
 *              required: false
 *              description: required for businesses
 *            gstCertificateNo:
 *              type: string
 *              required: false
 *              description: required for businesses
 *            incorprationCertificate:
 *              type: file
 *              required: false
 *              description: required for businesses
 *            expCertificate:
 *              type: file
 *              required: false
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
router.post("/createpartner", async (req, res) => {
  let {
    phone,
    Name,
    address,
    Dob,
    Type,
    Product_Service,
    email,
    gender,
    panNumber,
    aadharNumber,
    secondaryNumber,
    workingdays,
    bussinessName,
    business_hours,
    gstCertificateNo,
  } = req.body;

  let images = [];
  let docs = {};

  let panObj = {};
  let adadharObj = {};

  if (!phone || !Name || !Dob) {
    return res.status(400).json({
      message: "phone Name Dob required",
    });
  }

  try {
    const isPhoneExist = await Partner.findOne({ phone });
    if (isPhoneExist) {
      return res.status(400).json({
        message: "Phone number allready exists",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Error encountered while trying to uploading documents",
    });
  }

  if (req.files?.aadharImageF && req.files?.aadharImageB) {
    let af = randomImageName();
    let ab = randomImageName();

    images.push({ ...req.files?.aadharImageF, fileName: af });
    images.push({ ...req.files?.aadharImageB, fileName: ab });
    adadharObj = {
      number: aadharNumber,
      fileF: af,
      fileB: ab,
    };
  }

  if (req.files?.pancardImage) {
    let n = randomImageName();
    (panObj = { number: panNumber, file: n }),
      images.push({ ...req.files?.pancardImage, fileName: n });
  }

  if (
    Type === "store" &&
    (!req.files?.gstCertificate || !req.files?.incorprationCertificate)
  ) {
    return res.status(400).json({
      message: "gstCertificate incorprationCertificate documents required",
    });
  } else {
    docs["incorprationCertificate"] = req.files?.incorprationCertificate
      ? randomImageName()
      : null;
    docs["gstCertificate"] = req.files?.gstCertificate
      ? randomImageName()
      : null;

    if (req.files?.incorprationCertificate) {
      images.push({
        ...req.files?.incorprationCertificate,
        fileName: randomImageName(),
      });
    } else {
      images.push(undefined);
    }
    if (req.files?.gstCertificate) {
      images.push({
        ...req.files?.gstCertificate,
        fileName: randomImageName(),
      });
    } else {
      images.push(undefined);
    }
  }

  if (Type === "individual" && !req.files?.expCertificate) {
    return res
      .status(500)
      .json({ message: "expCertificate documents required" });
  } else {
    docs["expCertificate"] = req.files?.expCertificate
      ? randomImageName()
      : null;

    if (req.files?.expCertificate) {
      images.push({
        ...req.files?.expCertificate,
        fileName: randomImageName(),
      });
    } else {
      images.push(undefined);
    }
  }

  try {
    let fileUrls = await Promise.all(
      images.map((file, i) => {
        if (file) {
          return uploadFile(file.data, file.fileName, file.mimetype);
        } else {
          return;
        }
      })
    );

    const newPartner = new Partner({
      phone,
      Name,
      Dob,
      Type,
      Product_Service,
      email,
      gender,
      address,
      isProfileCompleted: true,
      isVerified: true,
      isApproved: true,
      bussinessName,
      workingdays,
      business_hours,
      aadhar: adadharObj,
      pan: panObj,
      secondaryNumber,
      gstCertificateNo,
      ...docs,
    });

    const resp = await newPartner.save();

    return res.status(201).json({ message: "New partner created", data: resp });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while trying to uploading documents",
    });
  }
});

/**
 * @openapi
 * /admin/partner/search:
 *  get:
 *    summary: This route is used to search partner by city
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: query
 *        name: city
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
router.get("/partner/search", async (req, res) => {
  try {
    let { city } = req.query;

    if (city && city.length < 3) {
      return res
        .status(400)
        .json({ status: true, message: "Should be grater then 3" });
    }
    city = trim(city);
    const regex = new RegExp(escapeRegExp(city), "gi");

    const data = await Partner.find({
      $and: [
        {
          $or: [{ "address.city": regex }],
        },
      ],
      isPublished: true,
    })
      .sort({
        createdAt: "-1",
      })
      .limit(20)
      .select("phone Name");

    return res
      .status(200)
      .json({ status: true, message: "partner lists", data });
  } catch (error) {
    return res.status(500).json({
      message: "Error encountered while searching partners",
    });
  }
});

/**
 * @openapi
 * /admin/createspecialist:
 *  post:
 *    summary: used to create specialist
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                phone:
 *                  type: string
 *                name:
 *                  type: string
 *                categories:
 *                  type: array
 *                  items:
 *                    type: string
 *                    example: 630a2cd91fb0df4a3cb75593
 *                email:
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
 *    security:
 *    - bearerAuth: []
 */
router.post("/createspecialist", async (req, response) => {
  try {
    if (!req?.body?.phone || !req?.body?.name || req?.body?.email) {
      return response.status(400).json({
        message: "missing phone name email required fields",
      });
    }

    const isPartnerExists = await Partner.findOne({ phone: req?.body?.phone });

    if (isPartnerExists) {
      return response.status(403).json({
        message: "specialist with this number already exists",
      });
    }
    const newspecialist = await Partner.create({
      phone: req?.body?.phone,
      Name: req?.body?.name,
      Type: "specialist",
      email: req?.body?.email ? req?.body?.email : "",
      isVerified: true,
      isApproved: true,
      isPublished: true,
      isProfileCompleted: false,
      isActive: true,
    });

    return response.status(201).json({
      message: "successfully created sub-provider",
      data: newspecialist,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      message: "Error encountered while trying to create new sub provider",
    });
  }
});

/**
 * @openapi
 * /admin/getspecialist:
 *  get:
 *    summary: used to fetch list of  all available specialist
 *    tags:
 *    - Admin Routes
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
router.get("/getspecialist", async (req, response) => {
  try {
    const data = await Partner.find({ Type: "specialist" });
    return response.status(200).json({ message: "specialist lists", data });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      message: "Error encountered while trying to create new sub provider",
    });
  }
});

/**
 * @openapi
 * /admin/get/partners/{type}:
 *  get:
 *    summary: using this route admin can see partners actions like all,kycpending and block users
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: path
 *        name: type
 *        required: true
 *        schema:
 *          type: string
 *          enum: ["kycpending", "block","all"]
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
router.get("/get/partners/:type", async (req, res) => {
  const { type } = req.params;

  if (type === "kycpending") {
    query = {
      isProfileCompleted: true,
      isVerified: false,
      isApproved: false,
      Type: { $ne: "sub-provider" },
    };
  } else if (type === "block") {
    query = { isPublished: false, Type: { $ne: "sub-provider" } };
  } else {
    query = { Type: { $ne: "sub-provider" } };
  }

  try {
    let partners = await Partner.find(query);
    res.status(200).json({ message: "Partners list", data: partners });
  } catch (error) {
    console.log(error);
  }
});

/**
 * @openapi
 * /admin/get/partner/{id}:
 *  get:
 *    summary: get partner by id
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
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
router.get("/get/partner/:id", async (req, res) => {
  const { id } = req.params;
  try {
    let partners = await Partner.findById(id);
    res.status(200).json({ message: "Partners data", data: partners });
  } catch (error) {
    console.log(error);
  }
});

/**
 * @openapi
 * /admin/partners/{id}/{type}:
 *  put:
 *    summary: using this route admin can update partner like all,kycpending and block users
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *      - in: path
 *        name: type
 *        required: true
 *        schema:
 *          type: string
 *          enum: ["approve", "block","unblock"]
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
router.put("/partners/:id", async (req, res) => {
  let query = {};
  const { type, id } = req.params;

  if (!id || !type) {
    return res.status(400).json({ message: `id and type required` });
  }

  try {
    if (type === "approve") {
      let isNotVerified = await Partner.findOne({
        _id: id,
        isApproved: false,
        isVerified: false,
      });

      query = { isApproved: true, isVerified: true };

      if (!isNotVerified) {
        return res
          .status(400)
          .json({ message: "Account is  allready verified" });
      }
    } else if (type === "block") {
      query = { isPublished: false };
    } else if (type === "unblock") {
      query = { isPublished: true };
    } else {
      return res.status(400).json({ message: "Invalid type" });
    }

    let partners = await Partner.findByIdAndUpdate(id, query, { new: true });

    // Add refferal credit to partner wallet
    if (
      partners &&
      type === "approve" &&
      query.isApproved &&
      query.isVerified &&
      partners.refferdCode
    ) {
      const referaledPerson = await Partner.findOne({
        uniqueReferralCode: partners.refferdCode,
      });

      // check is refferal code is valid
      if (referaledPerson) {
        // credit into referaled
        await makePartnerTranssaction(
          "partner",
          "successful",
          partners?._id,
          process.env.PARTNER_INVITATION_AMOUNT || 100,
          "Invitation Referal bonus",
          "credit"
        );

        // credit into refferall
        await makePartnerTranssaction(
          "partner",
          "successful",
          referaledPerson?._id,
          process.env.PARTNER_INVITATION_AMOUNT || 100,
          "Invited Referal bonus",
          "credit"
        );
      }
    }

    res
      .status(200)
      .json({ message: "operations successfully", data: partners });
  } catch (error) {
    console.log(error);
  }
});

/**
 * @openapi
 * /admin/getCoupons:
 *  get:
 *    summary: used to list all active Coupons.
 *    tags:
 *    - Admin Routes
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
router.get("/getCoupons", async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    return res.status(200).json(coupons);
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/getpartnertransaction?partnerid={partnerid}&start={start}&end={end}:
 *  get:
 *    summary: used to get all partnets transaction.
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: path
 *        name: partnerid
 *        required: true
 *        schema:
 *           type: string
 *      - in: path
 *        name: start
 *        required: false
 *        placeholder: yyyy-mm-dd
 *        schema:
 *           type: string
 *      - in: path
 *        name: end
 *        required: false
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
router.get("/getpartnertransaction", async (req, res) => {
  const { partnerid, start, end } = req.query;

  let query = {};

  if (partnerid) {
    console.log(partnerid);
    query["partnerId"] = partnerid;
  }

  if (start && !end) {
    return res.status(400).json({
      message: "Please ensure you pick two dates",
    });
  }

  if (start && end) {
    query["createdAt"] = {
      $gte: new Date(new Date(start).setHours(00, 00, 00)),
      $lt: new Date(new Date(end).setHours(23, 59, 59)),
    };
  }

  try {
    const orders = await WalletTransaction.find(query).sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/categories:
 *  post:
 *    summary: used to add Categories.
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        multipart/form-data:
 *          schema:
 *              type: object
 *              properties:
 *                icon:
 *                  type: file
 *                  description: required
 *                images:
 *                  type: array
 *                  items:
 *                    type: file
 *                name:
 *                  type: string
 *                  description: required
 *                categoryType:
 *                  type: string
 *                  description: required
 *                  enum: ["Home service","Store service","Auto care","Neha’s personal care"]
 *                Terms:
 *                  type: string
 *                  description: required
 *                forms:
 *                  type: array
 *                  items:
 *                    type: object
 *                    properties:
 *                      name:
 *                        type: string
 *                      features:
 *                        type: array
 *                        items:
 *                          type: string
 *                availableOn:
 *                  type: object
 *                  properties:
 *                    days:
 *                      type: array
 *                      items:
 *                        type: string
 *                    timing:
 *                      type: object
 *                      properties:
 *                        from:
 *                          type: string
 *                        to:
 *                          type: string
 *                slots:
 *                  type: array
 *                  items:
 *                    type: object
 *                    properties:
 *                      from:
 *                        type: string
 *                      to:
 *                        type: string
 *                components:
 *                  type: array
 *                  items:
 *                    type: string
 *                maxDisc:
 *                  type: Number
 *                minDisc:
 *                  type: Number
 *                maxDuration:
 *                  type: Number
 *                minDuration:
 *                  type: Number
 *                LeadExpense:
 *                  type: Number
 *                companyComissionPercentage:
 *                  type: Number
 *                servedAt:
 *                  type: array
 *                  items:
 *                    type: string
 *                    enum: ["InStore", "Home", "PickUpDrop"]
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
 *
 *    security:
 *    - bearerAuth: []
 */
router.post("/categories", async (req, res) => {
  try {
    req.body.forms = JSON.parse(req.body.forms);
    req.body.availableOn = JSON.parse(req.body.availableOn);
    req.body.servedAt = JSON.parse(req.body.servedAt);
    req.body.Slots = JSON.parse(req.body.Slots);
    req.body.key = req.body.name.toLowerCase();
    req.body.components = JSON.parse(req.body.components);
    req.body.details = JSON.parse(req.body.details);
    if (!req?.files?.icon) {
      return res.status(404).json({ message: "icon is missing" });
    }
    let images = [];
    if (Array.isArray(req?.files?.images)) {
      for (let i = 0; i < req?.files?.images.length; i++) {
        images.push(encodeImage(req?.files?.images[i]));
      }
    } else {
      images.push(encodeImage(req?.files?.images));
    }
    if (Array.isArray(req?.files?.detailImages)) {
      for (let i = 0; i < req?.files?.detailImages.length; i++) {
        req.body.details[i].image = encodeImage(req?.files?.detailImages[i]);
      }
    } else {
      req.body.details[0].image = encodeImage(req?.files?.detailImages);
    }
    req.body.icon = encodeImage(req.files.icon);
    req.body.images = images;
    const newCategory = new category(req.body);
    await newCategory.save();
    return res
      .status(201)
      .json({ message: "Category created successfully.", data: newCategory });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/categories/{id}:
 *  get:
 *    summary: get category by id
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
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
router.get("/categories/:id", async (req, res) => {
  const { id } = req.params;
  try {
    let categoryData = await category.findById(id);
    res.status(200).json({ message: "Category data", data: categoryData });
  } catch (error) {
    console.log(error);
  }
});

/**
 * @openapi
 * /admin/categories/:id:
 *  put:
 *    summary: used to update Categories.
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *    requestBody:
 *      content:
 *        multipart/form-data:
 *          schema:
 *              type: object
 *              properties:
 *                icon:
 *                  type: file
 *                  description: required
 *                name:
 *                  type: string
 *                  description: required
 *                categoryType:
 *                  type: string
 *                  description: required
 *                  enum: ["Home service","Store service","Auto care","Neha’s personal care"]
 *                Terms:
 *                  type: string
 *                  description: required
 *                forms:
 *                  type: array
 *                  items:
 *                    type: object
 *                    properties:
 *                      name:
 *                        type: string
 *                      features:
 *                        type: array
 *                        items:
 *                          type: string
 *                availableOn:
 *                  type: object
 *                  properties:
 *                    days:
 *                      type: array
 *                      items:
 *                        type: string
 *                    timing:
 *                      type: object
 *                      properties:
 *                        from:
 *                          type: string
 *                        to:
 *                          type: string
 *                slots:
 *                  type: array
 *                  items:
 *                    type: object
 *                    properties:
 *                      from:
 *                        type: string
 *                      to:
 *                        type: string
 *                components:
 *                  type: array
 *                  items:
 *                    type: string
 *                maxDisc:
 *                  type: Number
 *                minDisc:
 *                  type: Number
 *                maxDuration:
 *                  type: Number
 *                minDuration:
 *                  type: Number
 *                LeadExpense:
 *                  type: Number
 *                companyComissionPercentage:
 *                  type: Number
 *                servedAt:
 *                  type: array
 *                  items:
 *                    type: string
 *                    enum: ["InStore", "Home", "PickUpDrop"]
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
 *
 *    security:
 *    - bearerAuth: []
 */
router.put("/categories/:id", async (req, res) => {
  const { id } = req.params;
  // console.log(req.body)
  try {
    if (!id) {
      return res.status(404).json({ message: "id is missing" });
    }
    req.body.forms = JSON.parse(req.body.forms);
    req.body.availableOn = JSON.parse(req.body.availableOn);
    req.body.servedAt = JSON.parse(req.body.servedAt);
    req.body.Slots = JSON.parse(req.body.Slots);
    req.body.name = req.body.name.toLowerCase();
    req.body.components = JSON.parse(req.body.components);
    req.body.maxDisc = JSON.parse(req.body.maxDisc);
    req.body.minDisc = JSON.parse(req.body.minDisc);
    req.body.maxDuration = JSON.parse(req.body.maxDuration);
    req.body.minDuration = JSON.parse(req.body.minDuration);
    req.body.LeadExpense = JSON.parse(req.body.LeadExpense);
    req.body.companyComissionPercentage = JSON.parse(
      req.body.companyComissionPercentage
    );
    req.body.modelRequired = JSON.parse(req.body.modelRequired);
    req.body.details = JSON.parse(req.body.details);
    if (req.files) {
      let images = [];
      if (Array.isArray(req?.files?.images)) {
        for (let i = 0; i < req?.files?.images.length; i++) {
          images.push(encodeImage(req?.files?.images[i]));
        }
      } else {
        images.push(encodeImage(req?.files?.images));
      }
      if (Array.isArray(req?.files?.detailImages)) {
        for (let i = 0; i < req?.files?.detailImages.length; i++) {
          req.body.details[i].image = encodeImage(req?.files?.detailImages[i]);
        }
      } else {
        req.body.details[0].image = encodeImage(req?.files?.detailImages);
      }
      if (req.files.icon) {
        req.body.icon = encodeImage(req.files.icon);
      }
      req.body.images = images;
    }

    const updatedategory = await category.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    // console.log("updatedategory",updatedategory)
    if (updatedategory) {
      return res
        .status(200)
        .json({ message: "Category updated successfully." });
    } else {
      return res.status(400).json({ message: "Category not found." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/categories:
 *  delete:
 *    summary: deletes categories
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                categories:
 *                  type: array
 *                  description: list of unique id of all categories to be deleted
 *                  items:
 *                    type: string
 *                    example: 631c30d420f2e0484031e60f
 *    responses:
 *      200:
 *          description: if successfull fetchs all features for a form available.
 *          content:
 *            application/json:
 *             schema:
 *               type: array
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
 *
 *    security:
 *    - bearerAuth: []
 */
router.delete("/categories", async (req, res) => {
  try {
    let deleted = await category.updateMany(
      { _id: { $in: req.body.categories } },
      { isDeleted: true },
      { new: true }
    );
    return res.status(200).json({ message: "deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/Features:
 *  get:
 *    summary: lists all features for a form available
 *    tags:
 *    - Admin Routes
 *    responses:
 *      200:
 *          description: if successfull fetchs all features for a form available.
 *          content:
 *            application/json:
 *             schema:
 *               type: array
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
 *
 *    security:
 *    - bearerAuth: []
 */
router.get("/Features", async (req, res) => {
  try {
    let features = await Feature.find();
    res.status(200).json(features);
  } catch (error) {
    console.log(error);
  }
});

/**
 * @openapi
 * /admin/Features:
 *  post:
 *    summary: used to add Features.
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                  description: required
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
 *
 *    security:
 *    - bearerAuth: []
 */
router.post("/Features", async (req, res) => {
  try {
    const { name } = req.body;
    let feature = await Feature.create({ Name: name });
    res.status(201).json(feature);
  } catch (error) {
    console.log(error);
  }
});

/**
 * @openapi
 * /admin/orders/{status}:
 *  get:
 *    summary: using this route admin can get all orders by status.
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: path
 *        name: status
 *        required: true
 *        schema:
 *           type: string
 *           enum: ["Requested","Accepted", "InRepair", "completed","all","Cancelled","Reshedulled"]
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
router.get("/orders/:status", async (req, res) => {
  let { status } = req.params;

  const allowedStatus = [
    "all",
    "Requested",
    "Accepted",
    "InRepair",
    "completed",
    "Cancelled",
    "Reshedulled",
    "Initial",
  ];

  if (!allowedStatus.includes(status)) {
    return res.status(403).json({ message: `${status} status not allowed.` });
  }

  let query = {};

  if (status !== "all") {
    query["Status"] = status;
  }

  try {
    const orders = await Order.find(query)
      .populate("Customer", "phone Name")
      .populate("Partner", "phone Name")
      .populate("OrderDetails.Items.ServiceId", "modelName")
      .populate("OrderDetails.Items.CategoryId", "name")
      .populate("OrderDetails.Items.ModelId", "Name")
      .sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/service:
 *  post:
 *    summary: used to add new service.
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                categoryId:
 *                  type: string
 *                  description: required
 *                modelId:
 *                  type: string
 *                subCategoryId:
 *                  type: string
 *                serviceName:
 *                  type: string
 *                cost:
 *                  type: integer
 *                isTrivial:
 *                  type: boolean
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
 *
 *    security:
 *    - bearerAuth: []
 */
router.post("/service", async (req, res) => {
  try {
    const { categoryId, modelId, serviceName, cost, subCategoryId, isTrivial } =
      req.body;
    if (!categoryId)
      return res.status(400).json({ message: "category is reqiured" });
    let categorydoc = await category.findOne({
      _id: categoryId,
      isDeleted: false,
    });
    if (!categorydoc) {
      return res.status(400).json({ message: "category not found" });
    }
    if (categorydoc.modelRequired && !modelId) {
      return res
        .status(404)
        .json({ message: "modelId is reqiured for mobile services" });
    }
    let obj = { categoryId, serviceName, cost, subCategoryId, isTrivial };
    if (modelId) obj.modelId = modelId;
    let service = await Product_Service.create(obj);
    console.log(service);
    res.status(201).json({ status: 200, data: service });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
});

/**
 * @openapi
 * /admin/services:
 *  get:
 *    summary: get all services for specific category
 *    tags:
 *    - Index Routes
 *    parameters:
 *      - in: query
 *        name: categoryId
 *        required: true
 *        schema:
 *           type: string
 *      - in: query
 *        name: modelId
 *        schema:
 *           type: string
 *      - in: query
 *        name: subCategoryId
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
 *
 *    security:
 *    - bearerAuth: []
 */
router.get("/services", async (req, res) => {
  const { modelId, categoryId, subCategoryId } = req.query;

  if (!categoryId) {
    return res.status(500).json({ message: "categoryId is required" });
  }

  try {
    let filter = { categoryId: categoryId, ispublish: true };

    if (modelId) filter.modelId = modelId;
    if (subCategoryId) filter.subCategoryId = subCategoryId;

    const services = await Product_Service.find(filter)
      .populate("modelId")
      .populate("subCategoryId");
    return res
      .status(200)
      .json({ message: "list of services", data: services });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/ratecard:
 *  post:
 *    summary: used to upload models and services
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        multipart/form-data:
 *          schema:
 *              type: object
 *              properties:
 *                categoryId:
 *                  type: string
 *                  required: true
 *                brandId:
 *                  type: string
 *                  required: false
 *                modelId:
 *                  type: string
 *                  required: false
 *                csvfile:
 *                  type: file
 *                  required: true
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

router.post("/ratecard", async (req, res) => {
  const { categoryId, brandId, modelId } = req.body;

  if (!categoryId) {
    return res.status(400).json({ message: "categoryId is required" });
  }

  try {
    const isCategoryExists = await category.findOne({
      _id: categoryId,
      isDeleted: false,
    });

    if (!isCategoryExists) {
      return res.status(403).json({ message: "Category not exist" });
    }

    const file = req?.files?.csvfile;
    if (!file) {
      return res.status(400).send("No files were uploaded.");
    }
    if (isCategoryExists?.modelRequired) {
      if (!modelId || !brandId) {
        return res.status(400).json({
          message: "brandid and modelid is required for selected category",
        });
      }
      let brand = await Brand.findById(brandId);
      if (!brand) {
        return res.status(400).json({
          message: "brandid is invalid",
        });
      }
      let model = await Model.findById(modelId);
      if (!model) {
        return res.status(400).json({
          message: "modelid is invalid",
        });
      }
    }

    let filepath = path.join(__dirname, `../public/csv/${file.name}`);

    file.mv(filepath, async (err) => {
      try {
        if (err) {
          return res.status(500).send(err);
        }
        const jsonArray = await csv().fromFile(filepath);
        let result = await Promise.all(
          jsonArray.map((item) => {
            return new Promise(async (resolve, reject) => {
              try {
                let obj = {};
                obj.categoryId = categoryId;
                if (item.subcategory) {
                  let subcategory = await SubCategory.findOne({
                    name: item.subcategory.toLowerCase(),
                  });
                  if (!subcategory) {
                    subcategory = await SubCategory.create({
                      name: item.subcategory.toLowerCase(),
                      category: categoryId,
                    });
                  }
                  obj.subCategoryId = subcategory._id;
                }
                obj.serviceName = item["service name"];
                obj.cost = item.cost;
                obj.isTrivial = item.isTrivial ? Boolean(item.isTrivial) : true;
                if (isCategoryExists?.modelRequired) {
                  obj.modelId = modelId;
                }
                let newservice = await Product_Service.findOneAndUpdate(
                  { serviceName: item["service name"] },
                  obj,
                  { upsert: true, new: true }
                );
                resolve(newservice);
              } catch (err) {
                reject(err);
              }
            });
          })
        );
        fs.unlinkSync(filepath);

        return res.send({
          status: "File data uploaded successfully",
          // modelCount: modelsArr.length,
          // servicesCount: services.length,
        });
      } catch (error) {
        console.log(error);
        return res
          .status(500)
          .json({ message: "Error while processing file." });
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/settings:
 *  post:
 *    summary: used to update system settings.
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                taxName:
 *                  type: string
 *                  example: PHIXMAN
 *                taxNumber:
 *                  type: string
 *                  example: 12345678
 *                igst:
 *                  type: integer
 *                  example: 18
 *                sgst:
 *                  type: integer
 *                  example: 18
 *                email:
 *                  type: string
 *                  example: support@phixman.in
 *                whatsAppNumber:
 *                  type: string
 *                  example: 9876543210
 *                helplineNumber:
 *                  type: string
 *                  example: 9876543210
 *                supportContactNumber:
 *                  type: string
 *                  example: 9876543210
 *                surchargeIncomingPercent:
 *                  type: integer
 *                  example: 10
 *                surchargeOutgoingPercent:
 *                  type: integer
 *                  example: 10
 *                serviceChargeCommisionPercent:
 *                  type: integer
 *                  example: 10
 *                cashCollectionDeductionPercent:
 *                  type: integer
 *                  example: 10
 *                onTimeRewardCommssion:
 *                  type: integer
 *                  example: 10
 *                customerRatingRewardCommissionPercent:
 *                  type: integer
 *                  example: 10
 *                customerCancellationFees:
 *                  type: integer
 *                  example: 100
 *                tipAmtPercentage:
 *                  type: integer
 *                  example: 2
 *                taxPercentWithoutGST:
 *                  type: integer
 *                  example: 18
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
 *
 *    security:
 *    - bearerAuth: []
 */
router.post("/settings", async (req, res) => {
  try {
    let info = await SystemInfo.find();
    if (info.length === 0) {
      info = await SystemInfo.create(req.body);
      return res.status(201).json(info);
    }
    info = await SystemInfo.findByIdAndUpdate(info[0]._id, req.body, {
      new: true,
    });
    return res.status(200).json(info);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
});

/**
 * @openapi
 * /admin/walletTransactions:
 *  get:
 *    summary: route to fetch all credit transactions.
 *    tags:
 *    - Admin Routes
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
router.get("/walletTransactions", async (req, res) => {
  try {
    let trans = await getWalletTransactions();
    return res.status(200).json(trans);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/Country/add:
 *  post:
 *    summary: route to add new country.
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                Country:
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
router.post("/Country/add", async (req, res) => {
  try {
    let country = await Country.create({
      Name: req.body.Country,
      Code: req.body.Country.toLowerCase(),
    });
    return res.status(200).json(country);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/Country:
 *  get:
 *    summary: route to fetch all countries.
 *    tags:
 *    - Admin Routes
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
router.get("/Country", async (req, res) => {
  try {
    let country = await Country.find();
    return res.status(200).json(country);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/State/add:
 *  post:
 *    summary: route to add new states.
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                State:
 *                  type: string
 *                Country:
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
router.post("/State/add", async (req, res) => {
  try {
    let state = await State.create({
      Name: req.body.State.toLowerCase(),
      Country: req.body.Country,
    });
    return res.status(200).json(state);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/State:
 *  get:
 *    summary: route to fetch all states.
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: query
 *        name: country
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
router.get("/State", async (req, res) => {
  try {
    let filter = {};
    if (req?.query?.country) {
      filter.Country = req?.query?.country;
    }
    let states = await State.find().populate("Country");
    return res.status(200).json(states);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/City/add:
 *  post:
 *    summary: route to add new cities.
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                State:
 *                  type: string
 *                City:
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
router.post("/City/add", async (req, res) => {
  try {
    let state = await City.create({
      Name: req.body.City.toLowerCase(),
      State: req.body.State,
    });
    return res.status(200).json(state);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/City:
 *  get:
 *    summary: route to fetch all states.
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: query
 *        name: state
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
router.get("/City", async (req, res) => {
  try {
    let filter = {};
    if (req?.query?.state) {
      filter.State = req?.query?.state;
    }
    let states = await City.find(filter).populate({
      path: "State",
      populate: { path: "Country" },
    });
    return res.status(200).json(states);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/Zone/add:
 *  post:
 *    summary: route to add new cities.
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                Name:
 *                  type: string
 *                City:
 *                  type: string
 *                PinCodes:
 *                  type: array
 *                  items:
 *                    type: string
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
router.post("/Zone/add", async (req, res) => {
  try {
    let state = await Zone.create({
      ZoneId: commonFunction.genrateID("ZONE"),
      City: req.body.City,
      Name: req.body.Name,
      PinCodes: req.body.PinCodes,
    });
    return res.status(200).json(state);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/Zone:
 *  get:
 *    summary: route to fetch all states.
 *    tags:
 *    - Admin Routes
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
router.get("/Zone", async (req, res) => {
  try {
    let states = await Zone.find({ isDeleted: false })
      .populate({
        path: "City",
        select: "-__v",
        populate: {
          path: "State",
          select: "-__v",
          populate: { path: "Country", select: "-Code -__v" },
        },
      })
      .select("-__v");
    return res.status(200).json(states);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/zone/{_id}:
 *  patch:
 *    summary: Activate/deactivate or edit zone or delete zone using this api
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: path
 *        name: _id
 *        required: true
 *        schema:
 *           type: string
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                Name:
 *                  type: string
 *                City:
 *                  type: string
 *                PinCodes:
 *                  type: array
 *                  items:
 *                      type: string
 *                isActive:
 *                  type: string
 *                isDeleted:
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
 *    security:
 *    - bearerAuth: []
 */
router.patch("/Zone/:id", async (req, res) => {
  const { id } = req.params;
  try {
    let resp = await Zone.findByIdAndUpdate(id, req.body, { new: true });
    return res.status(200).json({ message: "zone updated", data: resp });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/create-subcategory:
 *  post:
 *    summary: route to create subcategory.
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                category:
 *                  type: string
 *                name:
 *                  type: string
 *                description:
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
router.post("/create-subcategory", async (req, res) => {
  try {
    let {
      body: { categoryId, name, description },
    } = req;

    let subcategoryObj = {
      category: categoryId,
      name,
      description,
    };
    const savedSubcategory = await SubCategory.create(subcategoryObj);
    if (!savedSubcategory)
      return res.status(404).send("Failed to save subcategory info");
    return res.send({
      status: 200,
      message: "subcategories created",
      data: savedSubcategory,
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
 * /admin/subcategory:
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

router.get("/subcategory", async (req, res) => {
  try {
    let {
      query: { categoryId },
    } = req;

    const foundSubcategory = await SubCategory.find({ category: categoryId });
    if (!foundSubcategory) {
      return res.status(404).send("No subcategories found");
    }

    return res.send({
      status: 200,
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
 * /admin/get-store-partner:
 *  get:
 *    summary: used to fetch list of all available store partner
 *    tags:
 *    - Admin Routes
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

router.get("/get-store-partner", async (req, response) => {
  try {
    const data = await Partner.find({ Type: "store" });
    return response.status(200).json({ message: "store partner lists", data });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      message: "Error encountered while trying to create new sub provider",
    });
  }
});

/**
 * @openapi
 * /admin/delete-customer-account:
 *  delete:
 *    summary: used to delete customer account
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                customerId:
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
router.delete("/delete-customer-account", async (req, res) => {
  try {
    const {
      body: { customerId },
      admin: { type },
    } = req;

    if (customerId.length == 0)
      return res.status(404).json({ message: "No Customer id found" });

    if (!type === adminTypeArray[0]) {
      return res.status(400).json({ message: "invalid admin type" });
    }
    const deleteUser = await Customer.deleteMany({ _id: customerId });

    if (!deleteUser)
      return res.status(400).json({ message: "unable to delete account" });

    return res.status(200).json({ message: "Customer account deleted" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while trying to deleting customer account",
    });
  }
});

/**
 * @openapi
 * /admin/delete-partner-account:
 *  delete:
 *    summary: used to delete partner account
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                partnerId:
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

router.delete("/delete-partner-account", async (req, res) => {
  try {
    const {
      body: { partnerId },
      admin: { type },
    } = req;

    if (partnerId.length == 0)
      return res.status(404).json({ message: "No partner id found" });

    if (!type === adminTypeArray[0]) {
      return res.status(400).json({ message: "invalid admin type" });
    }
    const deleteUser = await Partner.deleteMany({ _id: partnerId });

    if (!deleteUser)
      return res.status(400).json({ message: "unable to delete account" });

    return res.status(200).json({ message: "Partner account deleted" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while trying to deleting partner account",
    });
  }
});

/**
 * @openapi
 * /admin/wallet/customer:
 *  delete:
 *    summary: used to fetch wallet and transactions details
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: query
 *        name: customerId
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
router.get("/wallet/customer", checkAdmin, async (req, res) => {
  try {
    const {
      query: { customerId },
      admin: { type },
    } = req;
    if (!type === adminTypeArray[0]) {
      return res.status(400).json({ message: "invalid admin type" });
    }
    const walletData = await getCustomerWallet(customerId);
    const transactionData = await getAllWallletTranssactionForUser(
      customerId,
      "customer"
    );
    return res.status(200).json({
      message: "customer wallet and transaction",
      walletData,
      transactionData,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error encountered while trying to fetch wallet.",
    });
  }
});

/**
 * @openapi
 * /admin/offer/create:
 *  post:
 *    summary: used to create order
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                promoType:
 *                  type: string
 *                  enum: ["flat", "upto"]
 *                title:
 *                  type: string
 *                description:
 *                  type: string
 *                offerAmount:
 *                  type: string
 *                percentageOff:
 *                  type: string
 *                maxDisc:
 *                  type: string
 *                minCartValue:
 *                  type: string
 *                startValidity:
 *                  type: string
 *                endValidity:
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
router.post("/offer/create", checkAdmin, async (req, res) => {
  try {
    const {
      body: {
        promoType,
        title,
        description,
        offerAmount,
        percentageOff,
        maxDisc,
        minCartValue,
        startTime,
        endTime,
        startDate,
        endDate,
      },
    } = req;

    const promoCode = commonFunction.generateRandomString(promoType, 16);
    console.log(promoCode);
    const offerObj = {
      promoCode,
      promoType,
      title,
      description,
      offerAmount,
      percentageOff,
      maxDisc,
      minCartValue,
      startTime: moment(startDate)
        .set({ hour: startTime.split(":")[0], minute: startTime.split(":")[1] })
        .format(),
      endTime: moment(endDate)
        .set({ hour: endTime.split(":")[0], minute: endTime.split(":")[1] })
        .format(),
      startDate,
      endDate,
    };

    const newOffer = await Coupon.create(offerObj);
    if (!newOffer)
      return res.status(400).json({ message: "Unable to create offer" });
    return res.status(200).json({ message: "Offer created", data: newOffer });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while trying to create offer.",
    });
  }
});

/**
 * @openapi
 * /admin/offer/change-status:
 *  get:
 *    summary: used to change offer status
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: query
 *        name: offerId
 *      - in: query
 *        name: action
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
router.get("/offer/change-status", async (req, res) => {
  try {
    const {
      query: { offerId, action },
    } = req;

    if (!["enable", "disable"].includes(action))
      return res.status(400).json({ message: "invalid action" });

    const status = action === "enable" ? true : false;
    const changeOfferStatus = await Coupon.findOneAndUpdate(
      { _id: offerId },
      {
        $set: { isActive: status },
      },
      { new: true }
    );
    if (!changeOfferStatus)
      return res.status(404).json({ message: "Unable to change offer status" });

    return res
      .status(200)
      .json({ message: "Offer status changed", data: changeOfferStatus });
  } catch (error) {
    return res.status(500).json({
      message: "Error encountered while trying to change offer status.",
    });
  }
});

/**
 * @openapi
 * /admin/offer/all:
 *  get:
 *    summary: used to fetch all offers
 *    tags:
 *    - Admin Routes
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
router.get("/offer/all", async (req, res) => {
  try {
    const foundOffer = await Coupon.find({}).lean();
    if (!foundOffer)
      return res.status(404).json({ message: "No offers found" });
    return res.status(200).json({ message: "Offers found", data: foundOffer });
  } catch (error) {
    return res.status(500).json({
      message: "Error encountered while trying to change offer status.",
    });
  }
});

/**
 * @openapi
 * /admin/offer/get-offer:
 *  get:
 *    summary: used to get offer by offerId
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: query
 *        name: offerId
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
router.get("/offer/get-offer", checkAdmin, async (req, res) => {
  try {
    let {
      query: { offerId },
    } = req;
    const foundOffer = await Coupon.findById({ _id: offerId });
    if (!foundOffer)
      return res.status(404).json({ message: "Offer not found" });

    return res.status(200).json({ message: "offer found", data: foundOffer });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while trying to change offer status.",
    });
  }
});

/**
 * @openapi
 * /admin/offer/delete-offer:
 *  delete:
 *    summary: used to delete offer
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                offerId:
 *                  type: string
 *                  example: Test
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
router.delete("/offer/delete-offer", checkAdmin, async (req, res) => {
  try {
    let {
      body: { offerId },
    } = req;

    const deleteOffer = await Coupon.deleteOne({ _id: offerId }).lean();
    if (!deleteOffer)
      return res.status(404).json({ message: "Unable to delete offer" });

    return res
      .status(200)
      .json({ message: "offer deleted", data: deleteOffer });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while trying to change offer status.",
    });
  }
});

/**
 * @openapi
 * /admin/notification:
 *  get:
 *    summary: used to fetch notifications
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: query
 *        name: customerId
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

router.get("/notification", checkAdmin, async (req, res) => {
  try {
    let {
      query: { customerId },
    } = req;
    const foundNotifications = await Notification.find({ customerId })
      .select("title desc")
      .lean();
    if (!foundNotifications)
      return res.status(404).json({ message: "No notification found" });

    return res
      .status(200)
      .json({ message: "Notifications found", data: foundNotifications });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while trying to fetch notifications.",
    });
  }
});

/**
 * @openapi
 * /admin/penalties:
 *  get:
 *    summary: used to fetch penalties by orderid
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: query
 *        name: orderId
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
router.get("/penalties", async (req, res) => {
  try {
    let {
      query: { orderId },
    } = req;

    const foundPenalties = await PenalitySchema.find({ orderId }).populate(
      "orderId"
    );
    if (foundPenalties.length === 0)
      return res.status(200).json({ message: "No Penalties found" });

    return res.status(200).json({ message: "Penalties found", foundPenalties });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while trying to fetch penality.",
    });
  }
});

/**
 * @openapi
 * /admin/penalties/all:
 *  get:
 *    summary: used to fetch penalties
 *    tags:
 *    - Admin Routes
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
router.get("/penalties/all", async (req, res) => {
  try {
    const foundPenalties = await PenalitySchema.find({})
      .populate([
        {
          path: "orderId",
          model: Order,
          select: "-_id",
          populate: {
            path: "Partner",
            model: Partner,
          },
        },
        {
          path: "orderId",
          model: Order,
          select: "-_id",
          populate: {
            path: "Customer",
            model: Customer,
          },
        },
      ])
      .populate("partner");
    if (foundPenalties.length === 0)
      return res.status(400).json({ message: "No Penalties found" });

    return res.status(200).json({ message: "Penalties found", foundPenalties });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while trying to fetch penality.",
    });
  }
});

/**
 * @openapi
 * /admin/getpayouts:
 *  get:
 *    summary: used to fetch penalties
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: query
 *        name: status
 *        required: true
 *        schema:
 *           type: string
 *           enum: ["WITHDRAW","INPROGRESS", "SUCCESS", "FAILED","NOT_ALLOWED"]
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
router.get("/getpayouts", async (req, res) => {
  const { status } = req.query;
  let query = {};

  if (status && !payoutStatusTypes.includes(status)) {
    return res.status(400).json({ message: "status not allowed" });
  }

  if (status) {
    query["status"] = status;
  }

  try {
    const payoutsLists = await Payouts.findPayoutsList(query);
    return res.status(200).json({ message: "payouts list", payoutsLists });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while trying to fetch penality.",
    });
  }
});

/**
 * @openapi
 * /admin/ordertransaction:
 *  get:
 *    summary: used to fetch order transactions
 *    tags:
 *    - Admin Routes
 *    parameters:
 *      - in: query
 *        name: paymentStatus
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
router.get("/ordertransaction", async (req, res) => {
  try {
    let query = {};
    const { paymentStatus = "" } = req.query;

    if (paymentStatus != "") {
      query = { ...query, payment_status: paymentStatus };
    }
    const ordersTranssactions = await orderTransaction
      .find(query)
      .populate("ourorder_id")
      .sort({ orderId: -1 });

    return res
      .status(200)
      .json({ message: "transsaction list", ordersTranssactions });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while trying to order transaction.",
    });
  }
});



/**
 * @openapi
 * /admin/forms/:orderId:
 *  get:
 *    summary: using this route partner get jobcard and checkin card
 *    tags:
 *    - Admin Routes
 *    parameters:
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
router.get("/forms/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { type } = req.query;

  if (!orderId) {
    return res
      .status(500)
      .json({ message: "type or orderId must be provided" });
  }

  if (type && !["jobcard", "checkin"].includes(type)) {
    return res
      .status(500)
      .json({ message: "type should be jobCard or checkin" });
  }

  try {
    const isFormExists = await orderMetaData.findOne({ orderId });

    if (!isFormExists) {
      return res.status(404).json({ message: "Job card not found" });
    }

    // if(type){
    //   if(type === "jobcard"){
    //     delete isFormExists['checkIn'];
    //     console.log(isFormExists)
    //     return res.status(200).json({ message: "jobcard forms", data: isFormExists });
    //   }
    //   else{
    //     delete isFormExists.jobCard;
    //     return res.status(200).json({ message: "checking form", data: isFormExists });
    //   }
    // }
    return res.status(200).json({ message: "forms", data: isFormExists });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /admin/invoice/all:
 *  get:
 *    summary: used to fetch invoices
 *    tags:
 *    - Admin Routes
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
router.get("/invoice/all", async (req, res) => {
  try {
    const foundInvoice = await Invoice.find({})
      .lean()
      .populate("customer")
      .populate("partner")
      .populate("order")
      .populate("claim")
      .populate("vendor");

    if (foundInvoice.length === 0)
      return res.status(400).json({ message: "Invoice not found" });

    let returnObj = [];
    foundInvoice.forEach((invoice) => {
      let obj = {
        invoiceId: invoice.invoiceId,
        invoice_type: invoice.type,
        invoice_dt: invoice.date,
        invoice_status: invoice.status,
        order_id: invoice.order?.OrderId,
        claim_id: invoice.claim?.claimId,
        customer_code: invoice.customer?.Sno,
        customer_name: invoice.customer?.Name,
        partner_code: invoice.partner?.Sno,
        partner_name: invoice.partner?.Name,
        vendor_code: invoice.vendor?.Sno,
        vendor_name: invoice.vendor?.name,
      };
      returnObj.push(obj);
    });

    return res
      .status(200)
      .json({ message: "Successfully fetched Invoice", data: returnObj });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while trying to order transaction.",
    });
  }
});

/**
 * @openapi
 * /admin/invoice/phixman/tax:
 *  get:
 *    summary: used to fetch taxable phixman invoices
 *    tags:
 *    - Admin Routes
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
router.get("/invoice/phixman/tax", async (req, res) => {
  try {
    const foundInvoice = await Invoice.find({ taxPayer: null })
      .lean()
      .populate("customer")
      .populate("partner")
      .populate("order")
      .populate("claim")
      .populate("vendor");

    if (foundInvoice.length === 0)
      return res.status(400).json({ message: "Invoice not found" });

    let returnObj = [];

    foundInvoice.forEach((invoice) => {
      let obj = {
        invoiceId: invoice.invoiceId,
        invoice_type: invoice.type,
        invoice_dt: invoice.date,
        invoice_status: invoice.status,
        order_id: invoice.order?.OrderId,
        claim_id: invoice.claim?.claimId,
        customer_code: invoice.customer?.Sno,
        customer_name: invoice.customer?.Name,
        partner_code: invoice.partner?.Sno,
        partner_name: invoice.partner?.Name,
        vendor_code: invoice.vendor?.Sno,
        vendor_name: invoice.vendor?.name,
      };
      returnObj.push(obj);
    });

    return res
      .status(200)
      .json({ message: "Successfully fetched Invoice", data: returnObj });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while trying to order transaction.",
    });
  }
});

/**
 * @openapi
 * /admin/invoice/partner:
 *  get:
 *    summary: used to fetch partner invoices
 *    tags:
 *    - Admin Routes
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
router.get("/invoice/partner", async (req, res) => {
  try {
    const foundInvoice = await Invoice.find({ type: "ORDER_PART_B" })
      .lean()
      .populate("customer")
      .populate("partner")
      .populate("order")
      .populate("claim")
      .populate("vendor");
    if (foundInvoice.length === 0)
      return res.status(400).json({ message: "Invoice not found" });

    let returnObj = [];

    foundInvoice.forEach((invoice) => {
      let obj = {
        invoiceId: invoice.invoiceId,
        invoice_type: invoice.type,
        invoice_dt: invoice.date,
        invoice_status: invoice.status,
        order_id: invoice.order?.OrderId,
        claim_id: invoice.claim?.claimId,
        customer_code: invoice.customer?.Sno,
        customer_name: invoice.customer?.Name,
        partner_code: invoice.partner?.Sno,
        partner_name: invoice.partner?.Name,
        vendor_code: invoice.vendor?.Sno,
        vendor_name: invoice.vendor?.name,
      };
      returnObj.push(obj);
    });

    return res
      .status(200)
      .json({ message: "Successfully fetched Invoice", data: returnObj });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while trying to order transaction.",
    });
  }
});

/**
 * @openapi
 * /admin/invoice/partner/tax:
 *  get:
 *    summary: used to fetch taxable partner invoices
 *    tags:
 *    - Admin Routes
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
router.get("/invoice/partner/tax", async (req, res) => {
  try {
    const foundInvoice = await Invoice.find({
      type: "ORDER_PART_B",
      taxPayer: { $ne: null },
    })
      .lean()
      .populate("customer")
      .populate("partner")
      .populate("order")
      .populate("claim")
      .populate("taxPayer");
    if (foundInvoice.length === 0)
      return res.status(400).json({ message: "Invoice not found" });

    let returnObj = [];

    foundInvoice.forEach((invoice) => {
      let obj = {
        invoiceId: invoice.invoiceId,
        invoice_type: invoice.type,
        invoice_dt: invoice.date,
        invoice_status: invoice.status,
        order_id: invoice.order?.OrderId,
        claim_id: invoice.claim?.claimId,
        customer_code: invoice.customer?.Sno,
        customer_name: invoice.customer?.Name,
        partner_code: invoice.partner?.Sno,
        partner_name: invoice.partner?.Name,
        vendor_code: invoice.vendor?.Sno,
        vendor_name: invoice.vendor?.name,
        taxPayer: invoice?.taxPayer,
      };
      returnObj.push(obj);
    });

    return res
      .status(200)
      .json({ message: "Successfully fetched Invoice", data: returnObj });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while trying to order transaction.",
    });
  }
});

/**
 * @openapi
 * /admin/service/delete:
 *  delete:
 *    summary: used to delete offer
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                serviceIds:
 *                  type: array
 *                  items:
 *                      type: string
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
router.delete("/service/delete", async (req, res) => {
  try {
    const {
      body: { serviceIds },
    } = req;

    const deleteService = await Product_Service.updateMany(
      {
        _id: { $in: serviceIds },
      },
      {
        $set: {
          ispublish: false,
        },
      }
    );

    if (!deleteService)
      return res.status(400).json({ message: "Unable to delete services" });

    return res.status(200).json({ message: "Successfully deleted services" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while trying to delete service.",
    });
  }
});

module.exports = router;
