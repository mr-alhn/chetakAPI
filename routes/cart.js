const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Cart = require("../model/cart");
const authenticateToken = require("../middleware/userAuth");
const Book = require("../model/book");
const Rating = require("../model/rating");

const validateCart = [
  check("bookId").isNumeric().withMessage("Invalid bookId"),
  check("qty").isNumeric().withMessage("Quantity must be a number"),
];

router.post("/", authenticateToken, validateCart, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status: false, message: "Error", errors: errors.array() });
  }

  const { bookId, qty } = req.body;
  const userId = req.user.user.id;

  try {
    const existingCartItem = await Cart.findOne({
      where: { userId, bookId },
    });

    if (existingCartItem) {
      existingCartItem.qty += qty;
      await existingCartItem.save();
      res.status(200).json({
        status: true,
        message: "Cart item quantity updated",
        updatedCartItem: existingCartItem,
      });
    } else {
      const newCartItem = await Cart.create({ userId, bookId, qty });
      res
        .status(200)
        .json({ status: true, message: "Cart item added", newCartItem });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.user.id;

  try {
    const cartItems = await Cart.findAll({
      where: { userId },
    });

    const finalItems = [];
    for (const item of cartItems) {
      const book = await Book.findByPk(item.bookId);
      if (book) {
        const ratings = await Rating.findAll({ where: { bookId: book.id } });
        const totalRating = ratings.reduce(
          (sum, rating) => sum + rating.rate,
          0
        );
        const averageRating =
          ratings.length > 0 ? totalRating / ratings.length : 0;
        book.averageRating = averageRating;
        const finalBook = {
          ...book.toJSON(),
          pdf: null,
          image: JSON.parse(book.image),
          sample: JSON.parse(book.sample),
          tag: JSON.parse(book.tag),
          averageRating,
        };
        const finalCart = { ...item.dataValues, book: finalBook };
        finalItems.push(finalCart);
      }
    }
    res
      .status(200)
      .json({ status: true, message: "OK", cartItems: finalItems });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  const cartItemId = req.params.id;
  const { qty } = req.body;

  try {
    const existingCartItem = await Cart.findByPk(cartItemId);

    if (!existingCartItem) {
      return res
        .status(404)
        .json({ status: false, message: "Cart item not found" });
    }

    existingCartItem.qty = qty;

    await existingCartItem.save();

    res.status(200).json({
      status: true,
      message: "Cart item quantity updated successfully",
      updatedCartItem: existingCartItem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  const cartItemId = req.params.id;

  try {
    const cartItem = await Cart.findByPk(cartItemId);

    if (!cartItem) {
      return res
        .status(404)
        .json({ status: false, message: "Cart item not found" });
    }

    await cartItem.destroy();
    res
      .status(200)
      .json({ status: true, message: "Cart item deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

module.exports = router;
