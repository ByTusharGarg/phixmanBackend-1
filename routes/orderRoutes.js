const { orderStatusTypes } = require("../enums/types");
const { checkAdmin } = require('../middleware/AuthAdmin');
const checkTokenOnly = require('../middleware/checkToken');
const { Order, Counters } = require("../models");
const router = require("express").Router();

/**
 * @openapi
 * /Order/Bulk:
 *  get:
 *    summary: used to list all orders of user.
 *    tags:
 *    - Order Routes
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
router.get("/Bulk", async (req, res) => {
  try {
    const orders = await Order.find();
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});


/**
 * @openapi
 * /Order/{OrderId}:
 *  get:
 *    summary: used to fetch a specific order by OrderId.
 *    tags:
 *    - Order Routes
 *    parameters:
 *      - in: path
 *        name: OrderId
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

router.get("/:id", checkTokenOnly, async (req, res) => {
  const OrderId = req.params.id;
  try {
    const orders = await Order.findOne({ OrderId });
    return res.status(200).json({ message: "order details", data: orders });
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /Order/status/{status}/{partnerid}:
 *  get:
 *    summary: used to get order by status.
 *    tags:
 *    - Order Routes
 *    parameters:
 *      - in: path
 *        name: status
 *        required: true
 *        schema:
 *           type: string
 *           enum: ["Requested", "Accepted", "InRepair", "completed","Cancelled","all"]
 *      - in: path
 *        name: partnerid
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
router.get("/status/:status/:partnerId?", checkAdmin, async (req, res) => {
  let { status, partnerId } = req.params;

  if (!status && !partnerId) {
    return res.status(400).json({ message: "status or partner id required" });
  }

  if (status !== 'all' && !orderStatusTypes.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  let query = {};

  if (status === 'all') {
    query = {}
  }
  else if (status !== 'all') {
    query = { Status: status }
  }

  if (partnerId) {
    query = { ...query, Partner: partnerId }
  }

  try {
    const orders = await Order.find(query);
    return res.status(200).json(orders);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});



module.exports = router;
