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
const Order = require("../model/orders");
const Transaction = require("../model/transactions");
const Query = require("../model/query");
const Library = require("../model/library");
const sequelize = require("../config/db");
const { check, validationResult } = require("express-validator");
const moment = require("moment");

//Firebase Start
const admin = require("firebase-admin");
const serviceAccount = require("../chetak-books-firebase-adminsdk-jmjqy-4ce293f047.json");
const Notification = require("../model/notification");
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

router.get("/banner", async (req, res) => {
  try {
    const banners = await Banner.findAll();
    res.status(200).json({ status: true, message: "OK", banners });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.get("/books", async (req, res) => {
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
        pdf: null,
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

router.get("/books/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const userId = req.user ? req.user.user.id : 0;
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
      pdf: null,
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

router.get("/plans", async (req, res) => {
  try {
    const userId = req.user ? req.user.user.id : 0;
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

router.get("/coupon", async (req, res) => {
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
  check("traId").isString().withMessage("Invalid orderId"),
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

function generateOrderID() {
  const chars = "0123456789";
  let orderID = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    orderID += chars[randomIndex];
  }
  return orderID;
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
    const { planId, traId } = req.body;

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

      const orderId = `#${generateOrderID()}`;
      const status = true;
      await Premium.create({
        userId,
        planId,
        orderId,
        status,
        purchasedAt: purchaseDate,
        expireOn: expireDate,
        trId: traId,
      });

      await Transaction.create({
        userId,
        amount: plan.finalPrice,
        title: `You have purchased a Premium Plan Named "${plan.title}"`,
        orderId: orderId,
      });

      await Order.create({
        userId,
        orderId,
        totalAmount: plan.price,
        discount: 0,
        finalAmount: plan.finalPrice,
        traId,
        type: "plan",
      });

      res.status(200).json({
        status: true,
        message: "Premium subscription added",
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
          tokens.push(user.toJSON());
        }
      }
    } else if (sendTo == "paidUsers") {
      const users = await User.findAll();
      for (const user of users) {
        const plan = await Premium.findOne({ where: { userId: user.id } });
        if (plan) {
          tokens.push(user.toJSON());
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
        try {
          await admin.messaging().send(message);
          console.log(
            "Notification sent successfully to token:",
            token.notificationToken
          );
        } catch (error) {
          console.error(
            "Error sending notification to token:",
            token.notificationToken,
            error
          );
        }
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

    await subLib.destroy();

    res.status(200).json({ status: true, message: "Success" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

router.get("/transactions", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user.id;
    const transactions = await Transaction.findAll({ where: { userId } });

    const finalTra = [];
    for (const tra of transactions) {
      const tran = {
        ...tra.toJSON(),
        date: moment(tra.createdAt).format("On DD MMM YYYY"),
        title: tra.title.replace(/\\"/g, '"'),
      };
      delete tran.userId;
      delete tran.createdAt;
      delete tran.updatedAt;
      finalTra.push(tran);
    }

    finalTra.reverse();
    res.status(200).json({
      status: true,
      message: "OK",
      transactions: finalTra,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

const validationQuery = [
  check("name").isString().withMessage("name is required"),
  check("phone").isString().withMessage("phone is required"),
  check("query").isString().withMessage("query is required"),
];
router.post("/query", authenticateToken, validationQuery, async (req, res) => {
  try {
    const userId = req.user.user.id;
    const { name, phone, query } = req.body;

    await Query.create({ userId, name, phone, query });
    res.status(200).json({ status: true, message: "Query Submitted" });
  } catch (e) {
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

router.get("/reports", async (req, res) => {
  try {
    const counts = await Order.findAll({
      attributes: [
        "type",
        [sequelize.fn("COUNT", sequelize.col("*")), "totalCount"],
        [sequelize.fn("SUM", sequelize.col("finalAmount")), "totalFinalAmount"],
      ],
      group: ["type"],
    });
    const items = counts.map((item) => {
      item.dataValues.totalFinalAmount = parseFloat(
        item.dataValues.totalFinalAmount
      ).toFixed(2);
      return item;
    });

    const queries = await Query.findAll();

    res.json({ status: true, items, queries });
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

router.get("/reports/books", async (req, res) => {
  try {
    const orders = await Order.findAll({ where: { type: "book" } });

    const finalList = [];
    for (const order of orders) {
      const user = await User.findByPk(order.userId);

      const newBooks = [];
      const librarys = await Library.findAll({
        where: { orderId: order.orderId },
      });
      for (const lib of librarys) {
        const book = await Book.findByPk(lib.bookId);
        newBooks.push(book);
      }

      const newOrder = {
        ...order.toJSON(),
        user,
        date: moment(order.createdAt).format("MMM DD,YYYY"),
        books: newBooks,
      };
      delete newOrder.createdAt;
      delete newOrder.updatedAt;
      delete newOrder.type;
      delete newOrder.userId;
      finalList.push(newOrder);
    }

    res.status(200).json({ status: true, message: "OK", orders: finalList });
  } catch (e) {
    console.log(e);
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

router.get("/reports/subs", async (req, res) => {
  try {
    const items = await Order.findAll({ where: { type: "plan" } });

    const finalList = [];
    for (const item of items) {
      const user = await User.findByPk(item.userId);

      const prem = await Premium.findOne({ where: { orderId: item.orderId } });
      const plan = await Plan.findByPk(prem.planId);
      const newItem = {
        ...item.toJSON(),
        user,
        plan,
        date: moment(item.createdAt).format("MMM DD,YYYY"),
      };
      delete newItem.createdAt;
      delete newItem.updatedAt;
      delete newItem.type;
      delete newItem.userId;
      finalList.push(newItem);
    }

    res.status(200).json({ status: true, message: "OK", items: finalList });
  } catch (e) {
    console.log(e);
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

router.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.findAll();
    res.status(200).json({ status: true, message: "OK", notifications });
  } catch (e) {
    console.log(e);
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

module.exports = router;
