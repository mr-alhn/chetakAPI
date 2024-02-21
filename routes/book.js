const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Book = require("../model/book");
const Rating = require("../model/rating");
const Notification = require("../model/notification");
const Author = require("../model/author");

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
    const books = await Book.findAll({
      order: [["createdAt", "DESC"]],
    });

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
    res.status(200).json({
      status: true,
      message: "OK",
      books: finalbooks,
    });
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

    if (req.body.isPremium == false) {
      await Notification.create({
        bookId: newBook.id,
        title: `The Admin have added 1 new books named ${newBook.name}`,
      });
    }

    res.status(200).json({ status: true, message: "Book added", newBook });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const book = await Book.findByPk(id);

    const author = await Author.findByPk(book.author);

    const overAllRating = [];
    let count5 = 0,
      count4 = 0,
      count3 = 0,
      count2 = 0,
      count1 = 0;

    const ratings = await Rating.findAll({ where: { bookId: id } });
    const totalRating = ratings.reduce((sum, rating) => {
      switch (rating.rate) {
        case 5:
          count5++;
          break;
        case 4:
          count4++;
          break;
        case 3:
          count3++;
          break;
        case 2:
          count2++;
          break;
        case 1:
          count1++;
          break;
        default:
          break;
      }
      return sum + rating.rate;
    }, 0);

    const averageRating = ratings.length > 0 ? totalRating / ratings.length : 0;
    for (const rating of ratings) {
      overAllRating.push(rating);
    }

    const finalBook = {
      ...book.toJSON(),
      author: author.toJSON(),
      image: JSON.parse(book.image),
      sample: JSON.parse(book.sample),
      tag: JSON.parse(book.tag),
      pdf: book.pdf.replace(/"/g, ""),
      averageRating: parseFloat(averageRating).toFixed(1),
      overAllRating,
      ratingCounts: { count5, count4, count3, count2, count1 },
    };

    res.status(200).json({ status: true, message: "OK", book: finalBook });
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
  const {
    image,
    name,
    author,
    sample,
    tag,
    description,
    price,
    sellPrice,
    isTending,
    isRecommended,
    isPremium,
    subscriptionId,
  } = req.body;

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
    existingBook.isTending = isTending;
    existingBook.isRecommended = isRecommended;
    existingBook.isPremium = isPremium;
    existingBook.subscriptionId = subscriptionId;

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

router.delete("/rating/:id", async (req, res) => {
  const ratingId = req.params.id;

  try {
    const rating = await Rating.findByPk(ratingId);

    if (!rating) {
      return res
        .status(404)
        .json({ status: false, message: "Rating not found" });
    }

    await rating.destroy();
    res
      .status(200)
      .json({ status: true, message: "Rating deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});
module.exports = router;
