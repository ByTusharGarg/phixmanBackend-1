const router = require("express").Router();
const { AdminAuth } = require("../middleware");
const { Admin, Customer, Coupon, Order } = require("../models");
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

// router.use(AdminAuth.checkAdmin);

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
    const coupons = await Coupon.find({}, { otp: 0 });
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
 * /admin/Order:
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
router.post("/Order", async (req, res) => {
  try {
    const orders = await Order.find({});
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});

module.exports = router;
