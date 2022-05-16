const { orderStatusTypes } = require("../enums/types");
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
 * /Order/{uuid}:
 *  get:
 *    summary: used to fetch a specific order.
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
router.get("/:uuid", async (req, res) => {
  try {
    const orders = await Order.findOne({ _id: req?.params?.uuid });
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /Order:
 *  post:
 *    summary: used to create a new order.
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
router.post("/", async (req, res) => {
  try {
    let counterValue = await Counters.findOneAndUpdate(
      { name: "orders" },
      { $inc: { seq: 1 } },
      { new: true }
    );
    if (!counterValue) {
      counterValue = await Counters.create({ name: "orders" });
      // console.log(counterValue)
    }
    const order = await Order.create({
      ...req?.body,
      OrderId: `O${10000000 + counterValue?.seq}`,
      Status: orderStatusTypes[0],
      Customer: req?.Customer?._id,
      address: req?.body?.address,
    });
    return res.status(200).json(order);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

module.exports = router;
