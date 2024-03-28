const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Plan = require("../model/plan");

const validatePlan = [
  check("image").notEmpty().withMessage("Image URL is required"),
  check("title").notEmpty().withMessage("Title is required"),
  check("benefits")
    .isArray()
    .withMessage("Benefits must be an array of strings"),
  check("durationTitle").notEmpty().withMessage("durationTitle is required"),
  check("duration").notEmpty().withMessage("Duration is required"),
  check("price").isNumeric().withMessage("Price must be a numeric value"),
  check("finalPrice")
    .isNumeric()
    .withMessage("Price in Month must be a numeric value"),
  check("savePercent")
    .isInt({ min: 0, max: 100 })
    .withMessage("Save percent must be between 0 and 100"),
];

router.get("/", async (req, res) => {
  try {
    const plans = await Plan.findAll();
    res.status(200).json({ status: true, message: "OK", plans });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.post("/", validatePlan, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status: false, message: "Error", errors: errors.array() });
  }

  const {
    image,
    title,
    benefits,
    durationTitle,
    duration,
    price,
    finalPrice,
    savePercent,
  } = req.body;

  try {
    const newPlan = await Plan.create({
      image,
      title,
      benefits,
      durationTitle,
      duration,
      price,
      finalPrice,
      savePercent,
    });
    res.status(200).json({ status: true, message: "Plan added", newPlan });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.put("/:id", validatePlan, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status: false, message: "Error", errors: errors.array() });
  }

  const planId = req.params.id;
  const {
    image,
    title,
    benefits,
    durationTitle,
    duration,
    price,
    finalPrice,
    savePercent,
  } = req.body;

  try {
    const existingPlan = await Plan.findByPk(planId);

    if (!existingPlan) {
      return res.status(404).json({ status: false, message: "Plan not found" });
    }

    existingPlan.image = image;
    existingPlan.title = title;
    existingPlan.benefits = benefits;
    existingPlan.durationTitle = durationTitle;
    existingPlan.duration = duration;
    existingPlan.price = price;
    existingPlan.finalPrice = finalPrice;
    existingPlan.savePercent = savePercent;

    await existingPlan.save();

    res.status(200).json({
      status: true,
      message: "Plan updated successfully",
      updatedPlan: existingPlan,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  const planId = req.params.id;

  try {
    const plan = await Plan.findByPk(planId);

    if (!plan) {
      return res.status(404).json({ status: false, message: "Plan not found" });
    }

    await plan.destroy();
    res
      .status(200)
      .json({ status: true, message: "Plan deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

module.exports = router;
