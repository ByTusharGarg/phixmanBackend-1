const router = require("express").Router();
const { AdminAuth } = require("../middleware");

router.post("/Register", AdminAuth.registerAdmin);
router.post("/Login", AdminAuth.adminLogin);
router.use(AdminAuth.checkAdmin);
router.get("/test", (req, res) => {
  res.send(200);
});

module.exports = router;
