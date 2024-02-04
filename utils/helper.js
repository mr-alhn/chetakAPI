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
const User = require("../model/user");
const SubAdmin = require("../model/subAdmin");
const SubLib = require("../model/subLib");
const { check, validationResult } = require("express-validator");

//Firebase Start
const admin = require("firebase-admin");
const serviceAccount = require("../chetak-books-firebase-adminsdk-jmjqy-4ce293f047.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://chetak-books-default-rtdb.firebaseio.com/",
});
//Firebase End

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
    const books = await Book.findAll({ where: { isPremium: false } });
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
    const userId = req.user.user.id;
    const plans = await Plan.findAll();
    const formattedPlans = plans.map((plan) => {
      const formattedBenefits = JSON.parse(plan.benefits);
      return {
        ...plan.toJSON(),
        benefits: formattedBenefits,
      };
    });

    const finalPlan = [];
    for (const plan of formattedPlans) {
      const premium = await Premium.findOne({
        where: { userId, planId: plan.id },
      });

      if (premium) {
        const books = await Book.findAll({
          where: { subscriptionId: plan.id },
        });
        const finalbooks = [];
        for (const book of books) {
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

          if (finalBook.isTending) {
            trending.push(finalBook);
          }
          if (finalBook.isRecommended) {
            recommended.push(finalBook);
          }

          finalbooks.push(finalBook);
        }
        finalPlan.push({ ...plan, books: finalbooks });
      } else {
        finalPlan.push({ ...plan });
      }
    }

    res.status(200).json({ status: true, message: "OK", plans: finalPlan });
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

router.post("/notification", async (req, res) => {
  try {
    const { title, body, sendTo } = req.body;

    var tokens = [];
    if (sendTo == "freeUsers") {
      const users = await User.findAll();
      for (const user of users) {
        const plan = await Premium.findOne({ where: { userId: user.id } });
        if (!plan) {
          tokens.push(user.toJson());
        }
      }
    } else if (sendTo == "paidUsers") {
      const users = await User.findAll();
      for (const user of users) {
        const plan = await Premium.findOne({ where: { userId: user.id } });
        if (plan) {
          tokens.push(user.toJson());
        }
      }
    } else {
      const admins = await SubAdmin.findAll();
      for (const admin of admins) {
        tokens.push(admin.toJSON());
      }
    }

    for (const token of tokens) {
      if (token.notificationToken !== null) {
        const message = {
          data: {
            title: title,
            body: body,
            type: "pushNotification",
          },
          token: token.notificationToken,
        };
        await admin.messaging().send(message);
      }
    }

    res.status(200).json({ status: true, message: "Success" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

router.post("/subLib", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user.id;
    const { bookId, planId } = req.body;

    await SubLib.create({ userId, bookId, planId });

    res.status(200).json({ status: true, message: "Success" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

router.delete("/subLib/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const subLib = await SubLib.findByPk(id);

    if (!subLib) {
      return res.status(200).json({ status: true, message: "Success" });
    }

    await subLib.distroy();

    res.status(200).json({ status: true, message: "Success" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

module.exports = router;
