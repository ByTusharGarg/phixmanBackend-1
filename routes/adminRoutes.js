const router = require("express").Router();
const { AdminAuth } = require("../middleware");
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
} = require("../models");
const { rejectBadRequests } = require("../middleware");
const { encodeImage } = require("../libs/imageLib");
const Feature = require("../models/Features");
const commonFunction = require("../utils/commonFunction");
const { trim, escapeRegExp } = require("lodash");
const {
  paymentStatus,
  orderStatusTypes,
  orderTypes,
  paymentModeTypes,
} = require("../enums/types");
const { body } = require("express-validator");
const { makePartnerTranssaction } = require("./walletRoute");
const { randomImageName, uploadFile } = require("../services/s3-service");
const { updatePassword } = require("../middleware/AuthAdmin");
const path = require("path");
const csv = require("csvtojson");
const fs = require("fs");
const { getParseModels } = require("../libs/commonFunction");

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
 *                password:
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

// router.use(AdminAuth.checkAdmin);

/**
 * @openapi
 * /admin/partner/search?q=???:
 *  get:
 *    summary: This route is used to search partner by city
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
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
router.get("/partner/search", async (req, res) => {
  let q = req.query.q;

  if (q.length < 3) {
    return res
      .status(400)
      .json({ status: true, message: "Should be grater then 3" });
  }
  q = trim(q);

  let isPublished = true;

  try {
    const regex = new RegExp(escapeRegExp(q), "gi");

    const data = await Partner.find({
      $and: [
        {
          $or: [{ "address.city": regex }],
        },
      ],
      isPublished,
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
 * /admin/customer/search?q=???:
 *  get:
 *    summary: This route admin can used to search customer by number
 *    tags:
 *    - Admin Routes
 *    requestBody:
 *      content:
 *        application/json:
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
router.get("/customer/search", async (req, res) => {
  let q = req.query.q;

  if (q.length < 3) {
    return res
      .status(400)
      .json({ status: true, message: "Should be grater then 3" });
  }
  q = trim(q);

  let isPublished = true;

  try {
    const regex = new RegExp(escapeRegExp(q), "gi");

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
 * /admin/updatepassword:
 *  post:
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
 */
router.put("/updatepassword", updatePassword);

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
 * /admin/SendOTP:
 *  post:
 *    summary: request server to genrate and send otp on given number.
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
router.post("/createcustomer", async (req, res) => {
  console.log(req.body.phone.length);
  // return
  if (!req?.body?.phone || req.body.phone.length < 10) {
    return res.status(200).json({ message: "invalid number or required" });
  }
  try {
    //check if customer with given number exists and update otp in db, else create new customer.
    const isuserExist = await Customer.findOne({ phone: req?.body?.phone });
    if (isuserExist) {
      return res
        .status(500)
        .json({ message: "Customer number already exists" });
    } else {
      const newuser = new Customer({
        phone: req?.body?.phone,
        isVerified: true,
      });
      const newUserResp = await newuser.save();
      console.log(newUserResp._id);
      // generate customer wallet
      const newWallet = new CustomerWallet({ customerId: newUserResp?._id });
      await newWallet.save();
    }
    return res.status(200).json({ message: "Customer created successfully" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error encountered while trying to send otp" });
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
 *                PartnerId:
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
        .status(500)
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
        return res.status(500).json({ message: "Cod  is allowed." });
      }
      const newOrder = new Order({
        Partner: partnerId,
        Customer: customerId,
        OrderId,
        OrderType,
        Status: orderStatusTypes[2],
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
 *              enum: ["store", "individual"]
 *            Product_Service:
 *              type: string
 *              required: true
 *            panNumber:
 *              type: string
 *              required: true
 *            aadharNumber:
 *              type: string
 *              required: true
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
  } = req.body;

  let images = [];
  let docs = {};

  if (!phone || !Name || !Dob) {
    return res.status(500).json({
      message: "phone Name Dob required",
    });
  }

  try {
    const isPhoneExist = await Partner.findOne({ phone });
    if (isPhoneExist) {
      return res.status(500).json({
        message: "Phone number allready exists",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Error encountered while trying to uploading documents",
    });
  }

  const {
    aadharImageF,
    aadharImageB,
    pancardImage,
    gstCertificate,
    incorprationCertificate,
    expCertificate,
  } = req.files;

  if (!aadharImageF || !aadharImageB || !pancardImage) {
    return res.status(500).json({
      message: "aadharImageF, aadharImageB, pancardImage documents required",
    });
  } else {
    images.push({ ...aadharImageF, fileName: randomImageName() });
    images.push({ ...aadharImageB, fileName: randomImageName() });
    images.push({ ...pancardImage, fileName: randomImageName() });
  }

  if (Type === "store" && (!gstCertificate || !incorprationCertificate)) {
    return res.status(500).json({
      message: "gstCertificate incorprationCertificate documents required",
    });
  } else {
    docs["incorprationCertificate"] = incorprationCertificate
      ? randomImageName()
      : null;
    docs["gstCertificate"] = gstCertificate ? randomImageName() : null;

    if (incorprationCertificate) {
      images.push({ ...incorprationCertificate, fileName: randomImageName() });
    } else {
      images.push(undefined);
    }
    if (gstCertificate) {
      images.push({ ...gstCertificate, fileName: randomImageName() });
    } else {
      images.push(undefined);
    }
  }

  if (Type === "individual" && !expCertificate) {
    return res
      .status(500)
      .json({ message: "expCertificate documents required" });
  } else {
    docs["expCertificate"] = expCertificate ? randomImageName() : null;

    if (expCertificate) {
      images.push({ ...expCertificate, fileName: randomImageName() });
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
      aadhar: {
        number: aadharNumber,
        fileF: images[0].fileName,
        fileB: images[1].fileName,
      },
      pan: { number: panNumber, file: images[2].fileName },
      secondaryNumber,
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
    const orders = await Order.find({});
    return res.status(200).json(orders);
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
    for (let key in req.body) {
      if (!req?.body[key]) {
        return res.status(404).json({ message: `${key} is missing` });
      }
    }
    if (!req?.files?.icon) {
      return res.status(404).json({ message: "icon is missing" });
    }
    req.body.icon = encodeImage(req.files.icon);
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
 * /admin/orders/{status}:
 *  get:
 *    summary: using this route user can get all orders of his/her.
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
    return res.status(500).json({ message: `${status} status not allowed.` });
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
  let query = {};
  const { type } = req.params;

  if (type === "kycpending") {
    query = { isProfileCompleted: true, isVerified: false, isApproved: false };
  } else if (type === "block") {
    query = { isPublished: false };
  } else {
    query = {};
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
 * /admin/partners/{type}:
 *  put:
 *    summary: using this route admin can update partner like all,kycpending and block users
 *    tags:
 *    - Admin Routes
 *    parameters:
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
  const { id } = req.params;
  const { type } = req.body;

  if (!id || !type) {
    return res.status(500).json({ message: `id and type required` });
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
          .status(500)
          .json({ message: "Account is  allready verified" });
      }
    } else if (type === "block") {
      query = { isPublished: false };
    } else if (type === "unblock") {
      query = { isPublished: true };
    } else {
      return res.status(200).json({ message: "Invalid type" });
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
 *                serviceName:
 *                  type: string
 *                cost:
 *                  type: integer
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
    const { categoryId, modelId, serviceName, cost } = req.body;
    if (!categoryId)
      return res.status(404).json({ message: "category is reqiured" });
    let categorydoc = await category.findOne({
      _id: categoryId,
      isDeleted: false,
    });
    if (!categorydoc) {
      return res.status(404).json({ message: "category not found" });
    }
    if (categorydoc.key === "mobile" && !modelId) {
      return res
        .status(404)
        .json({ message: "modelId is reqiured for mobile services" });
    }
    let obj = { categoryId, serviceName, cost };
    if (modelId) obj.modelId = modelId;
    let service = await Product_Service.create(obj);
    res.status(201).json(service);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
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
    return res.status(500).json({ message: "categoryId is required" });
  }

  try {
    const isCategoryExists = await category.findOne({
      _id: categoryId,
      isDeleted: false,
    });

    if (!isCategoryExists) {
      return res.status(500).json({ message: "Category not exist" });
    }

    const file = req?.files?.csvfile;
    if (!file) {
      return res.status(400).send("No files were uploaded.");
    }
    if (
      isCategoryExists?.name.toLowerCase() === "mobile" ||
      isCategoryExists?.name.toLowerCase() === "tablet"
    ) {
      if (!modelId || !brandId) {
        return res.status(500).json({
          message: "brandid and modelid is required for mobile and tablet",
        });
      }
      let brand = await Brand.findById(brandId);
      if (!brand) {
        // brand = await Brand.create({
        //   Name: item.brand,
        //   brandId: item.brand.toLowerCase(),
        // });
        return res.status(500).json({
          message: "brandid is invalid",
        });
      }
      let model = await Model.findById(modelId);
      if (!model) {
        // model = await Model.create({
        //   categoryId,
        //   Name: item.model,
        //   modelId: item.model.toLowerCase(),
        //   brandId: brand._id,
        // });
        return res.status(500).json({
          message: "modelid is invalid",
        });
      }
    }

    let filepath = path.join(__dirname, `../public/csv/${file.name}`);

    file.mv(filepath, async (err) => {
      try {
        if (err) {
          console.log(err);
          return res.status(500).send(err);
        }
        const jsonArray = await csv().fromFile(filepath);
        console.log(jsonArray);
        let result = await Promise.all(
          jsonArray.map((item) => {
            return new Promise(async (resolve, reject) => {
              try {
                let obj = {};
                obj.categoryId = categoryId;
                obj.serviceName = item["service name"];
                obj.cost = item.cost;
                obj.isTrivial = item.isTrivial ? item.isTrivial : true;
                if (
                  isCategoryExists?.name.toLowerCase() === "mobile" ||
                  isCategoryExists?.name.toLowerCase() === "tablet"
                ) {
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
        console.log(result);
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
module.exports = router;
