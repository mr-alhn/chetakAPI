const express = require("express");
const router = express.Router();
const Favorite = require("../model/favorite");
const authenticateToken = require("../middleware/userAuth");
const Book = require("../model/book");
const Rating = require("../model/rating");

router.post("/", authenticateToken, async (req, res) => {
  const userId = req.user.user.id;
  const { bookId } = req.body;

  try {
    const existingFavorite = await Favorite.findOne({
      where: { userId, bookId },
    });

    if (existingFavorite) {
      return res.status(400).json({
        status: false,
        message: "Book is already in favorites",
      });
    }

    const newFavorite = await Favorite.create({ userId, bookId });
    res
      .status(200)
      .json({ status: true, message: "Book added to favorites", newFavorite });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.user.id;

  try {
    const favoriteBooks = await Favorite.findAll({
      where: { userId },
    });

    const finalItems = [];
    for (const item of favoriteBooks) {
      const book = await Book.findByPk(item.bookId);
      if (book) {
        const ratings = await Rating.findAll({ where: { bookId: book.id } });
        const totalRating = ratings.reduce(
          (sum, rating) => sum + rating.rate,
          0
        );
        const averageRating =
          ratings.length > 0 ? totalRating / ratings.length : 0;
        const finalBook = { ...book.dataValues, averageRating };
        const finalCart = { ...item.dataValues, book: finalBook };
        finalItems.push(finalCart);
      }
    }

    res
      .status(200)
      .json({ status: true, message: "OK", favoriteBooks: finalItems });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.delete("/:bookId", authenticateToken, async (req, res) => {
  const userId = req.user.user.id;
  const bookId = req.params.bookId;

  try {
    const favorite = await Favorite.findOne({
      where: { userId, bookId },
    });

    if (!favorite) {
      return res.status(404).json({
        status: false,
        message: "Book not found in favorites",
      });
    }

    await favorite.destroy();
    res
      .status(200)
      .json({ status: true, message: "Book removed from favorites" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

module.exports = router;
