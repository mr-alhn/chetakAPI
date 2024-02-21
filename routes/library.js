const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Library = require("../model/library");
const Book = require("../model/book");
const authenticateToken = require("../middleware/userAuth");
const Rating = require("../model/rating");
const Cart = require("../model/cart");
const Premium = require("../model/premium");
const SubLib = require("../model/subLib");
const Coupon = require("../model/coupon");
const Transaction = require("../model/transactions");
const Order = require("../model/orders");
const Plan = require("../model/plan");
const Author = require("../model/author");

const validateLibraryItem = [
  check("traId").notEmpty().withMessage("Invalid orderId"),
];

function generateOrderID() {
  const chars = "0123456789";
  let orderID = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    orderID += chars[randomIndex];
  }
  return orderID;
}

router.post("/", authenticateToken, validateLibraryItem, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status: false, message: "Error", errors: errors.array() });
  }

  const userId = req.user.user.id;
  const { traId, couponId } = req.body;

  try {
    const books = await Cart.findAll({ where: { userId } });

    if (books.length === 0) {
      return res.status(401).json({ status: false, message: "Cart is Empty" });
    }

    let finalAmount = 0;
    let couponDiscount = 0;
    const usingCoupon = false;
    let coupon = {};
    let message = "";
    if (books.length == 1) {
      message = "You have purchased a E-Book";
    } else {
      message = `You have purchased ${books.length} E-Books`;
    }

    if (couponId) {
      coupon = await Coupon.findByPk(couponId);
      if (!coupon) {
        return res
          .status(404)
          .json({ status: false, message: "Coupon Not Found" });
      }
      usingCoupon = true;
    }

    const orderId = generateOrderID();

    for (const book of books) {
      const bookDetails = await Book.findByPk(book.bookId);
      if (bookDetails) {
        await Library.create({
          userId,
          bookId: book.bookId,
          orderId: `#${orderId}`,
          traId,
        });
        finalAmount += bookDetails.sellPrice;
        const author = await Author.findByPk(bookDetails.author);
        if (author) {
          const authorHas = author.royalty;
          const authorEarned = (bookDetails.sellPrice * author.percent) / 100;
          author.royalty = authorHas + authorEarned;
          await author.save();
        }
      }
    }

    if (usingCoupon) {
      if (coupon.type == "fixed") {
        couponDiscount = coupon.value;
      } else {
        couponDiscount = (finalAmount * coupon.value) / 100;
      }
    }

    const paidAmount = finalAmount - couponDiscount;

    await Transaction.create({
      userId,
      amount: paidAmount,
      title: message,
      orderId: `#${orderId}`,
    });

    await Order.create({
      userId,
      orderId: `#${orderId}`,
      totalAmount: finalAmount,
      discount: couponDiscount,
      finalAmount: paidAmount,
      traId,
      type: "book",
    });

    await Cart.destroy({ where: { userId } });

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
      const libs = await SubLib.findAll({
        where: { userId, planId: sub.planId },
      });

      const plan = await Plan.findByPk(sub.planId);

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
        delete finalBook.createdAt;
        delete finalBook.updatedAt;
        books.push(finalBook);
      }
      delete sub.planId;
      delete plan.benefits;
      const finalPlan = {
        ...sub.toJSON(),
        plan: { ...plan.toJSON(), benefits: JSON.parse(plan.benefits) },
        books,
      };
      delete finalPlan.planId;
      delete finalPlan.userId;
      delete finalPlan.orderId;
      delete finalPlan.trId;
      delete finalPlan.createdAt;
      delete finalPlan.updatedAt;
      delete finalPlan.id;
      delete finalPlan.status;
      delete finalPlan.purchasedAt;
      delete finalPlan.expireOn;
      plansBooks.push(finalPlan);
    }

    res.status(200).json({
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
