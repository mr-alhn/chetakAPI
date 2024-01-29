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
const Premium = require("../model/premium");
const { check, validationResult } = require("express-validator");

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
      ...book.toJSON(),
      image: JSON.parse(book.image),
      sample: JSON.parse(book.sample),
      tag: JSON.parse(book.tag),
      pdf: book.pdf.replace(/"/g, ""),
      averageRating: parseFloat(averageRating).toFixed(1),
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
    const formattedPlans = plans.map((plan) => {
      const formattedBenefits = JSON.parse(plan.benefits);
      return {
        ...plan.toJSON(),
        benefits: formattedBenefits,
      };
    });
    res
      .status(200)
      .json({ status: true, message: "OK", plans: formattedPlans });
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

const validatePremiumSubscription = [
  check("planId").isNumeric().withMessage("Invalid planId"),
  check("orderId").isString().withMessage("Invalid orderId"),
];

function calculatePurchaseAndExpireDate(months) {
  const purchaseDate = new Date();
  const expireDate = new Date();
  expireDate.setMonth(expireDate.getMonth() + months);
  const formatDate = (date) => {
    const options = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return date.toLocaleDateString("en-US", options);
  };
  return {
    purchaseDate: formatDate(purchaseDate),
    expireDate: formatDate(expireDate),
  };
}

router.post(
  "/plans/buy",
  authenticateToken,
  validatePremiumSubscription,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ status: false, message: "Error", errors: errors.array() });
    }

    const userId = req.user.user.id;
    const { planId, orderId } = req.body;

    try {
      const existingPremiumSubscription = await Premium.findOne({
        where: { userId, planId },
      });

      if (existingPremiumSubscription) {
        return res.status(400).json({
          status: false,
          message: "Premium subscription already exists for the user",
        });
      }

      const plan = await Plan.findByPk(planId);

      if (!plan) {
        return res.status(400).json({
          status: false,
          message: "Premium subscription not found",
        });
      }

      const { purchaseDate, expireDate } = calculatePurchaseAndExpireDate(
        plan.duration
      );
      console.log(expireDate);

      const status = true;
      const newPremiumSubscription = await Premium.create({
        userId,
        planId,
        orderId,
        status,
        purchasedAt: purchaseDate,
        expireOn: expireDate,
      });
      res.status(200).json({
        status: true,
        message: "Premium subscription added",
        newPremiumSubscription,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({ status: false, message: "Server Error" });
    }
  }
);

module.exports = router;
