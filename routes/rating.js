const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Rating = require("../model/rating");
const authenticateToken = require("../middleware/userAuth");

const validateRating = [
  check("bookId").isNumeric().withMessage("Invalid bookId"),
  check("rate")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rate must be between 1 and 5"),
  check("review").optional().isString().withMessage("Review must be a string"),
];

router.post("/", authenticateToken, validateRating, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status: false, message: "Error", errors: errors.array() });
  }

  const { bookId, rate, review } = req.body;
  const userName = req.user.user.name;
  const userId = req.user.user.id;

  try {
    const newRating = await Rating.create({
      bookId,
      userId,
      userName,
      rate,
      review,
    });
    res.status(200).json({ status: true, message: "Rating added", newRating });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.put("/:id", authenticateToken, validateRating, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status: false, message: "Error", errors: errors.array() });
  }

  const ratingId = req.params.id;
  const { bookId, rate, review } = req.body;
  const userName = req.user.user.name;
  const userId = req.user.user.id;

  try {
    const existingRating = await Rating.findByPk(ratingId);

    if (!existingRating) {
      return res
        .status(404)
        .json({ status: false, message: "Rating not found" });
    }

    existingRating.bookId = bookId;
    existingRating.userId = userId;
    existingRating.userName = userName;
    existingRating.rate = rate;
    existingRating.review = review;

    await existingRating.save();

    res.status(200).json({
      status: true,
      message: "Rating updated successfully",
      updatedRating: existingRating,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
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
