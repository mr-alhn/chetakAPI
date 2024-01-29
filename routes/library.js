const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Library = require("../model/library");
const Book = require("../model/book");
const authenticateToken = require("../middleware/userAuth");
const Rating = require("../model/rating");
const Cart = require("../model/cart");
const Transaction = require("../model/transaction");
const Premium = require("../model/premium");
const SubLib = require("../model/subLib");

const validateLibraryItem = [
  check("bookId").isNumeric().withMessage("Invalid bookId"),
  check("orderId").notEmpty().withMessage("Invalid orderId"),
  check("from").notEmpty().withMessage("from is required"),
];

router.post("/", authenticateToken, validateLibraryItem, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status: false, message: "Error", errors: errors.array() });
  }

  const userId = req.user.user.id;
  const { orderId } = req.body;

  await Transaction.create({ type: "Book", traId: orderId });

  try {
    const books = await Cart.findAll({ where: { userId } });

    for (const book of books) {
      await Library.create({
        userId,
        bookId: book.id,
      });
    }

    res.status(200).json({
      status: true,
      message: "Success",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.user.id;

  try {
    const libraryItems = await Library.findAll({
      where: { userId },
    });

    const items = [];
    for (const item of libraryItems) {
      const product = await Book.findByPk(item.bookId);
      if (product) {
        const ratings = await Rating.findAll({ where: { bookId: product.id } });
        const totalRating = ratings.reduce(
          (sum, rating) => sum + rating.rate,
          0
        );
        const averageRating =
          ratings.length > 0 ? totalRating / ratings.length : 0;
        const finalBook = {
          ...product.toJSON(),
          image: JSON.parse(product.image),
          sample: JSON.parse(product.sample),
          tag: JSON.parse(product.tag),
          pdf: product.pdf.replace(/"/g, ""),
          totalRating: ratings.length,
          averageRating: parseFloat(averageRating).toFixed(1),
        };

        items.push(finalBook);
      }
    }

    const subscription = await Premium.findAll({ where: { userId } });
    const plansBooks = [];
    for (const sub of subscription) {
      const libs = await SubLib.findAll({ where: { userId, planId: sub.id } });

      const books = [];
      for (const lib of libs) {
        const book = await Book.findByPk(lib.bookId);
        const ratings = await Rating.findAll({
          where: { bookId: book.id },
        });
        const totalRating = ratings.reduce(
          (sum, rating) => sum + rating.rate,
          0
        );
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
        books.push({ ...book.toJSON });
      }
      plansBooks.push({ ...sub.toJSON(), books });
    }

    res
      .status(200)
      .json({
        status: true,
        message: "OK",
        libraryItems: items,
        premiumBook: plansBooks,
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.delete("/:bookId", authenticateToken, async (req, res) => {
  const userId = req.user.user.id;
  const bookId = req.params.bookId;

  try {
    const libraryItem = await Library.findOne({
      where: { userId, bookId },
    });

    if (!libraryItem) {
      return res.status(404).json({
        status: false,
        message: "Book not found in the library",
      });
    }

    await libraryItem.destroy();
    res
      .status(200)
      .json({ status: true, message: "Book removed from the library" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

module.exports = router;
