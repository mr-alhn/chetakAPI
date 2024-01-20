const express = require("express");
const multer = require("multer");
const router = express.Router();
const path = require("path");
const Banner = require("../model/banner");
const authenticateToken = require("../middleware/userAuth");
const Book = require("../model/book");
const Rating = require("../model/rating");
const Plan = require("../model/plan");
const Coupon = require("../model/coupon");

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    const currentDateTime = Date.now();
    const extension = path.extname(file.originalname);
    const newFilename = `${currentDateTime}${extension}`;
    cb(null, newFilename);
  },
});
const upload = multer({ storage: storage });

router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: false, message: "No file uploaded" });
  }
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;
  res
    .status(201)
    .json({ status: true, message: "File uploaded successfully", fileUrl });
});

router.get("/banner", authenticateToken, async (req, res) => {
  try {
    const banners = await Banner.findAll();
    res.status(200).json({ status: true, message: "OK", banners });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.get("/books", authenticateToken, async (req, res) => {
  try {
    const books = await Book.findAll();
    const recommended = [];
    const trending = [];

    const finalbooks = [];
    for (const book of books) {
      const ratings = await Rating.findAll();
      const totalRating = ratings.reduce((sum, rating) => sum + rating.rate, 0);
      const averageRating =
        ratings.length > 0 ? totalRating / ratings.length : 0;
      const finalBook = {
        ...book.dataValues,
        totalRating: ratings.length,
        averageRating,
      };

      if (finalBook.isTending) {
        trending.push(finalBook);
      }
      if (finalBook.isRecommended) {
        recommended.push(finalBook);
      }

      finalbooks.push(finalBook);
    }
    res.status(200).json({
      status: true,
      message: "OK",
      trending,
      recommended,
      books: finalbooks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.get("/books/:id", authenticateToken, async (req, res) => {
  const id = req.params.id;
  try {
    const userId = req.user.user.id;
    const book = await Book.findByPk(id);

    const userRating = [];
    const overAllRating = [];

    const ratings = await Rating.findAll({ where: { bookId: id } });
    const totalRating = ratings.reduce((sum, rating) => sum + rating.rate, 0);
    const averageRating = ratings.length > 0 ? totalRating / ratings.length : 0;
    for (const rating of ratings) {
      if (rating.userId == userId) {
        userRating.push(rating);
      }
      overAllRating.push(rating);
    }

    const finalBook = {
      ...book.dataValues,
      averageRating,
      userRating,
      overAllRating,
    };

    const similarBooks = [];
    const books = await Book.findAll({ where: { author: finalBook.author } });
    for (const item of books) {
      if (item.id != id) {
        const ratings = await Rating.findAll({ where: { bookId: item.id } });
        const totalRating = ratings.reduce(
          (sum, rating) => sum + rating.rate,
          0
        );
        const averageRating =
          ratings.length > 0 ? totalRating / ratings.length : 0;
        const finalItem = { ...item.dataValues, averageRating };
        similarBooks.push(finalItem);
      }
    }

    res
      .status(200)
      .json({ status: true, message: "OK", book: finalBook, similarBooks });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.get("/plans", authenticateToken, async (req, res) => {
  try {
    const plans = await Plan.findAll();
    res.status(200).json({ status: true, message: "OK", plans });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.get("/coupon", authenticateToken, async (req, res) => {
  try {
    const coupons = await Coupon.findAll();
    res.status(200).json({ status: true, message: "OK", coupons });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

module.exports = router;
