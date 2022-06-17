var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('index', { title: 'Express' });
  res.status(200).send("Welcome to Coderschool!");
});

/* Book router */
const bookRouter = require("./bookapi");
router.use("/books", bookRouter);

module.exports = router;
