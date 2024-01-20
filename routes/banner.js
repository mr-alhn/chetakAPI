const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Banner = require("../model/banner");

const validateBanner = [
  check("image").notEmpty().withMessage("Image is required"),
];

router.get("/", async (req, res) => {
  try {
    const banners = await Banner.findAll();
    res.status(200).json({ status: true, message: "OK", banners });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.post("/", validateBanner, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status: false, message: "Error", errors: errors.array() });
  }

  const { image } = req.body;

  try {
    const newBanner = await Banner.create({ image });
    res.status(200).json({ status: true, message: "Banner added", newBanner });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  const bannerId = req.params.id;

  try {
    const banner = await Banner.findByPk(bannerId);

    if (!banner) {
      return res
        .status(404)
        .json({ status: false, message: "Banner not found" });
    }

    await banner.destroy();
    res
      .status(200)
      .json({ status: true, message: "Banner deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

module.exports = router;
