const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Author = require("../model/author");
const Book = require("../model/book");
const Rating = require("../model/rating");
const Library = require("../model/library");
const Order = require("../model/orders");

const validateAuthor = [
  check("name").trim().notEmpty().withMessage("Name is required"),
  check("royalty")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Royalty must be a positive number"),
  check("percent")
    .isFloat({ min: 0 })
    .withMessage("Percent must be a positive number"),
];

router.get("/", async (req, res) => {
  try {
    const authors = await Author.findAll({ order: [["createdAt", "DESC"]] });

    const finalAuthors = [];
    for (const author of authors) {
      let totalSale = 0;
      let recievedAmount = 0;
      const books = await Book.findAll({ where: { author: author.id } });
      for (const book of books) {
        const bookSale = await Library.findAll({ where: { bookId: book.id } });
        for (const sale of bookSale) {
          const order = await Order.findOne({
            where: { orderId: sale.orderId, traId: sale.traId },
          });
          if (order) {
            recievedAmount += order.finalAmount;
          }
        }
        totalSale += bookSale.length;
      }

      const finalAuthor = {
        ...author.toJSON(),
        totalBooks: books.length,
        totalSale,
        recievedAmount,
      };
      delete finalAuthor.createdAt;
      delete finalAuthor.updatedAt;
      finalAuthors.push(finalAuthor);
    }

    res
      .status(200)
      .json({ status: true, message: "OK", authors: finalAuthors });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  const authorId = req.params.id;

  try {
    const author = await Author.findByPk(authorId);
    if (!author) {
      return res
        .status(404)
        .json({ status: false, message: "Author not found" });
    }

    const books = await Book.findAll({ where: { author: authorId } });

    const finalbooks = [];
    for (const book of books) {
      const ratings = await Rating.findAll({ where: { bookId: book.id } });
      const totalRating = ratings.reduce((sum, rating) => sum + rating.rate, 0);
      const averageRating =
        ratings.length > 0 ? totalRating / ratings.length : 0;
      const finalBook = {
        ...book.toJSON(),
        image: JSON.parse(book.image),
        sample: JSON.parse(book.sample),
        tag: JSON.parse(book.tag),
        pdf: book.pdf.replace(/"/g, ""),
        totalRating: ratings.length,
        averageRating: parseFloat(averageRating).toFixed(1),
      };
      finalbooks.push(finalBook);
    }

    author.book = finalbooks;

    res
      .status(200)
      .json({ status: true, message: "OK", author, book: finalbooks });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.post("/", validateAuthor, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: false,
      message: "Validation Error",
      errors: errors.array(),
    });
  }

  const { name, royalty, percent } = req.body;

  try {
    const newAuthor = await Author.create({
      name,
      royalty: royalty || 0,
      percent,
    });
    res
      .status(201)
      .json({ status: true, message: "Author created", author: newAuthor });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.put("/:id", validateAuthor, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: false,
      message: "Validation Error",
      errors: errors.array(),
    });
  }

  const authorId = req.params.id;
  const { name, royalty, percent } = req.body;

  try {
    const author = await Author.findByPk(authorId);
    if (!author) {
      return res
        .status(404)
        .json({ status: false, message: "Author not found" });
    }

    await author.update({ name, royalty, percent });
    res.status(200).json({ status: true, message: "Author updated", author });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  const authorId = req.params.id;

  try {
    const author = await Author.findByPk(authorId);
    if (!author) {
      return res
        .status(404)
        .json({ status: false, message: "Author not found" });
    }

    await author.destroy();
    res.status(200).json({ status: true, message: "Author deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

module.exports = router;
