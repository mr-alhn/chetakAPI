const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Book = require("../model/book");

const validateBook = [
  check("image").isArray().withMessage("Image must be an array of URLs"),
  check("name").notEmpty().withMessage("Name is required"),
  check("author").notEmpty().withMessage("Author is required"),
  check("sample").isArray().withMessage("Sample must be an array of URLs"),
  check("tag").isArray().withMessage("Tag must be an array of strings"),
  check("description").notEmpty().withMessage("Description is required"),
  check("price").isNumeric().withMessage("Price must be a numeric value"),
  check("sellPrice")
    .isNumeric()
    .withMessage("Sell Price must be a numeric value"),
];

router.get("/", async (req, res) => {
  try {
    const books = await Book.findAll();
    res.status(200).json({ status: true, message: "OK", books });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.post("/", validateBook, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status: false, message: "Error", errors: errors.array() });
  }

  try {
    const newBook = await Book.create(req.body);
    res.status(200).json({ status: true, message: "Book added", newBook });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.put("/:id", validateBook, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status: false, message: "Error", errors: errors.array() });
  }

  const bookId = req.params.id;
  const { image, name, author, sample, tag, description, price, sellPrice } =
    req.body;

  try {
    const existingBook = await Book.findByPk(bookId);

    if (!existingBook) {
      return res.status(404).json({ status: false, message: "Book not found" });
    }

    existingBook.image = image;
    existingBook.name = name;
    existingBook.author = author;
    existingBook.sample = sample;
    existingBook.tag = tag;
    existingBook.description = description;
    existingBook.price = price;
    existingBook.sellPrice = sellPrice;

    await existingBook.save();

    res.status(200).json({
      status: true,
      message: "Book updated successfully",
      updatedBook: existingBook,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  const bookId = req.params.id;

  try {
    const book = await Book.findByPk(bookId);

    if (!book) {
      return res.status(404).json({ status: false, message: "Book not found" });
    }

    await book.destroy();
    res
      .status(200)
      .json({ status: true, message: "Book deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

module.exports = router;
