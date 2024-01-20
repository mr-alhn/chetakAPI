const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Premium = require("../model/premium");
const authenticateToken = require("../middleware/userAuth");

const validatePremiumSubscription = [
  check("planId").isNumeric().withMessage("Invalid planId"),
  check("orderId").isString().withMessage("Invalid orderId"),
];

router.post(
  "/",
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

      const newPremiumSubscription = await Premium.create({
        userId,
        planId,
        orderId,
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

router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const premiumSubscriptions = await Premium.findAll({
      where: { userId },
    });

    res.status(200).json({ status: true, message: "OK", premiumSubscriptions });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.delete("/:planId", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const planId = req.params.planId;

  try {
    const premiumSubscription = await Premium.findOne({
      where: { userId, planId },
    });

    if (!premiumSubscription) {
      return res.status(404).json({
        status: false,
        message: "Premium subscription not found",
      });
    }

    await premiumSubscription.destroy();
    res
      .status(200)
      .json({ status: true, message: "Premium subscription removed" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

module.exports = router;
