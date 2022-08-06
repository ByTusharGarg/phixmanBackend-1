const router = require("express").Router();
const { AdminAuth } = require("../middleware");
const {
  Admin,
  Customer,
  Coupon,
  Order,
  WalletTransaction,
  category,
} = require("../models");
const { rejectBadRequests } = require("../middleware");
const { encodeImage } = require("../libs/imageLib");
const Feature = require("../models/Features");
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

router.use(AdminAuth.checkAdmin);

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
  return res.send(200);
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
router.post("/categories", rejectBadRequests, async (req, res) => {
  try {
    for (let key in req.body) {
      if (!req.body[key]) {
        return res.status(404).json({ message: `${key} is missing` });
      }
    }
    if (!req.files.icon) {
      return res.status(404).json({ message: "icon is missing" });
    }
    req.body.forms = JSON.parse(req.body.forms);
    req.body.availableOn = JSON.parse(req.body.availableOn);
    if (!req.body.slots.startsWith("["))
      req.body.slots = JSON.parse(`[${req.body.slots}]`);
    else req.body.slots = JSON.parse(`[${req.body.slots}]`);
    req.body.key = req.body.name.toLowerCase();
    req.body.icon = encodeImage(req.files.icon);
    if (typeof req.body.components === "string") {
      req.body.components = req.body.components.split(",");
    }
    if (typeof req.body.components === "string") {
      req.body.servedAt = req.body.servedAt.split(",");
    }
    console.log(req.body);
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
module.exports = router;
