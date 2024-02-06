// couponRoutes.js
const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Coupon = require("../model/coupon");

const validateCoupon = [
  check("coupon").notEmpty().withMessage("Coupon code is required"),
  check("type").isIn(["fixed", "percent"]).withMessage("Invalid coupon type"),
  check("qty").isInt({ min: 1 }).withMessage("Quantity must be greater than 0"),
];

router.get("/", async (req, res) => {
  try {
    const coupons = await Coupon.findAll();
    res.status(200).json({ status: true, message: "OK", coupons });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.post("/", validateCoupon, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status: false, message: "Error", errors: errors.array() });
  }

  const { coupon, type, qty, value, description } = req.body;

  try {
    const newCoupon = await Coupon.create({
      coupon,
      type,
      qty,
      value,
      description,
    });
    res.status(200).json({ status: true, message: "Coupon added", newCoupon });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.put("/:id", validateCoupon, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status: false, message: "Error", errors: errors.array() });
  }

  const couponId = req.params.id;
  const { coupon, type, qty, value, description } = req.body;

  try {
    const existingCoupon = await Coupon.findByPk(couponId);

    if (!existingCoupon) {
      return res
        .status(404)
        .json({ status: false, message: "Coupon not found" });
    }

    existingCoupon.coupon = coupon;
    existingCoupon.type = type;
    existingCoupon.qty = qty;
    existingCoupon.value = value;
    existingCoupon.description = description;

    await existingCoupon.save();

    res.status(200).json({
      status: true,
      message: "Coupon updated successfully",
      updatedCoupon: existingCoupon,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  const couponId = req.params.id;

  try {
    const coupon = await Coupon.findByPk(couponId);

    if (!coupon) {
      return res
        .status(404)
        .json({ status: false, message: "Coupon not found" });
    }

    await coupon.destroy();
    res
      .status(200)
      .json({ status: true, message: "Coupon deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.get("/check", async (req, res) => {
  try {
    const coupon = req.query.coupon;

    const hasCoupon = await Coupon.findOne({ where: { coupon } });

    if (!hasCoupon) {
      return res.status(500).json({ status: false, message: "Invalid Coupon" });
    }

    res
      .status(200)
      .json({ status: true, message: "Valid Coupon", coupon: hasCoupon });
  } catch (e) {
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

module.exports = router;
