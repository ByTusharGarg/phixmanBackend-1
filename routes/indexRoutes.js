const { param } = require("express-validator");
const { rejectBadRequests } = require("../middleware");
const { ProductType } = require("../models");
const router = require("express").Router();

const getServiceParamValidators = [
  param("serviceType")
    .notEmpty()
    .withMessage("service type cannot be empty")
    .isIn(["home", "store"])
    .withMessage("service type is invalid"),
];

/**
 * @openapi
 * /products/{serviceType}:
 *  get:
 *    summary: lists all product types available for store service
 *    tags:
 *    - Index Routes
 *    parameters:
 *      - in: path
 *        name: serviceType
 *        required: true
 *        schema:
 *           type: string
 *           enum: ["home","store"]
 *    responses:
 *      200:
 *          description: if successfully fetch all product types.
 *          content:
 *            application/json:
 *             schema:
 *               type: array
 *               description: list of all the product types available for store service.
 *               items:
 *                type: object
 *                properties:
 *                  name:
 *                   type: string
 *                  icon:
 *                   type: string
 *                  key:
 *                   type: string
 *                  video:
 *                   type: string
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
router.get(
  "/products/:serviceType",
  ...getServiceParamValidators,
  rejectBadRequests,
  async (req, res) => {
    try {
      const products = await ProductType.find({
        servedAt: req?.params?.serviceType,
      });
      return res.status(200).json(
        products.map((prod) => {
          return {
            name: prod.name,
            icon: prod.icon,
            key: prod.key,
            video: prod.video,
          };
        })
      );
    } catch (error) {
      return res.status(500).json({ message: "Error encountered." });
    }
  }
);

module.exports = router;
