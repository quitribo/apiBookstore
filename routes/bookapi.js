const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const router = express.Router();

// GET QUERY BOOK
router.get("/", (req, res, next) => {
  // INPUT VALIDATION
  const allowedMethods = [
    "author",
    "country",
    "language",
    "title",
    "page",
    "limit",
  ];
  try {
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    // allow title, limit and page query string only
    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedMethods.includes(key)) {
        const exception = new Error(`${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterQuery[key]) delete filterQuery[key];
    });

    // PROCESSING LOGIC
    let offset = limit * (page - 1);
    let db = fs.readFileSync("db.json", "utf8");
    db = JSON.parse(db);
    const { books } = db;

    // Filter data by title
    let result = [];

    if (filterQuery.length) {
      filterKeys.forEach((condition) => {
        result = result.length
          ? result.filter((book) => book[condition] === filterQuery[condition])
          : books.filter((book) => book[condition] === filterQuery[condition]);
      });
    } else {
      result = books;
    }

    result = result.slice(offset, offset + limit);
    res.status(200).send(result);
    // SEND RESPONSE
  } catch (error) {
    next(error);
  }
});

// POST ANY BOOK
router.post("/", (req, res, next) => {
  // POST INPUT VALIDATION
  try {
    const { author, country, imageLink, language, pages, title, year } =
      req.body;
    if (
      !author ||
      !country ||
      !imageLink ||
      !language ||
      !pages ||
      !title ||
      !year
    ) {
      const exception = new Error(`Missing body info`);
      exception.statusCode = 401;
      throw exception;
    }
    // POST PROCESSING LOGIC
    const newBook = {
      author,
      country,
      imageLink,
      language,
      pages: parseInt(pages) || 1,
      title,
      year: parseInt(year) || 0,
      id: crypto.randomBytes(4).toString("hex"),
    };
    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { books } = db;

    books.push(newBook);
    db.books = books;
    db = JSON.stringify(db);

    fs.writeFileSync("db.json", db);

    // POST SEND RESPONSE
    res.status(200).send(newBook);
    //   console.log("this is the req.body", req.body);
    //   res.status(200).send("OK");
  } catch (error) {
    next(error);
  }
});

// UPDATE A SELECTED BOOK
router.put("/:bookId", (req, res, next) => {
  // PUT INPUT VALIDATION
  try {
    const allowUpdate = [
      "author",
      "country",
      "imageLink",
      "language",
      "pages",
      "title",
      "year",
    ];

    const { bookId } = req.params;
    const updates = req.body;
    const updateKeys = Object.keys(updates);
    const notAllow = updateKeys.filter((el) => !allowUpdate.includes(el));

    if (notAllow.length) {
      const exception = new Error(`Update field not allow`);
      exception.statusCode = 401;
      throw exception;
    }

    // PUT PROCESSING
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { books } = db;
    //find book by id
    const targetIndex = books.findIndex((book) => book.id === bookId);
    if (targetIndex < 0) {
      const exception = new Error(`Book not found`);
      exception.statusCode = 404;
      throw exception;
    }
    //Update new content to db book JS object
    const updatedBook = { ...db.books[targetIndex], ...updates };
    db.books[targetIndex] = updatedBook;
    db = JSON.stringify(db);
    fs.writeFileSync("db.json", db);

    // PUT SEND RESPONSE
    res.status(200).send(updatedBook);
  } catch (error) {
    next(error);
  }
});

// DELETE A SELECTED BOOK
router.delete("/:bookId", (req, res, next) => {
  //DELETE INPUT VALIDATION
  try {
    const { bookId } = req.params;
    // DELETE PROCESSING
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { books } = db;
    const targetIndex = books.findIndex((book) => book.id === bookId);

    if (targetIndex < 0) {
      const exception = new Error(`Book not found`);
      exception.statusCode = 404;
      throw exception;
    }

    db.books = books.filter((book) => book.id !== bookId);
    db = JSON.stringify(db);
    fs.writeFileSync("db.json", db);

    //DELETE SEND RESPONSE
    res.status(200).send({});
  } catch (error) {
    next(error);
  }
});

module.exports = router;
