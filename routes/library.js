const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Library = require("../model/library");
const Book = require("../model/book");
const authenticateToken = require("../middleware/userAuth");
const Rating = require("../model/rating");

const validateLibraryItem = [
  check("bookId").isNumeric().withMessage("Invalid bookId"),
  check("orderId").notEmpty().withMessage("Invalid orderId"),
];

router.post("/", authenticateToken, validateLibraryItem, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status: false, message: "Error", errors: errors.array() });
  }

  const userId = req.user.user.id;
  const { bookId, orderId } = req.body;

  try {
    const existingLibraryItem = await Library.findOne({
      where: { userId, bookId },
    });

    if (existingLibraryItem) {
      return res.status(400).json({
        status: false,
        message: "Book is already in the library",
      });
    }

    const newLibraryItem = await Library.create({ userId, bookId, orderId });
    res.status(200).json({
      status: true,
      message: "Book added to the library",
      newLibraryItem,
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
          ...product.dataValues,
          totalRating: ratings.length,
          averageRating,
        };
        const finalLib = { ...item.dataValues, book: finalBook };
        items.push(finalLib);
      }
    }

    res.status(200).json({ status: true, message: "OK", libraryItems: items });
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
