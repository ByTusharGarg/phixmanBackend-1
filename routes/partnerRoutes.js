const router = require("express").Router();

/**
 * @openapi
 * /partner/Login:
 *  post:
 *    summary: route to perform login
 *    tags:
 *    - Partner Routes
 */
router.post("/Login", (req, res) => {
  return res.status(200).json({ message: "ok" });
});

module.exports = router;
