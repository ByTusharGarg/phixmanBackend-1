const router = require("express").Router();

router.get("/", (req, res) => {
  return res.send(
    `<code>Server is running at PORT: ${process.env.PORT} </code>`
  );
});

module.exports = router;
