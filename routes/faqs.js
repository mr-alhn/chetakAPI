const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const FAQ = require("../model/faq");

const validateFAQ = [
  check("question").notEmpty().withMessage("Question is required"),
  check("answer").notEmpty().withMessage("Answer is required"),
];

router.get("/", async (req, res) => {
  try {
    const faqs = await FAQ.findAll();
    res.status(200).json({ status: true, message: "OK", faqs });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.post("/", validateFAQ, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status: false, message: "Error", errors: errors.array() });
  }

  const { question, answer } = req.body;

  try {
    const newFAQ = await FAQ.create({ question, answer });
    res.status(200).json({ status: true, message: "FAQ added", newFAQ });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.put("/:id", validateFAQ, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status: false, message: "Error", errors: errors.array() });
  }

  const faqId = req.params.id;
  const { question, answer } = req.body;

  try {
    const existingFAQ = await FAQ.findByPk(faqId);

    if (!existingFAQ) {
      return res.status(404).json({ status: false, message: "FAQ not found" });
    }

    existingFAQ.question = question;
    existingFAQ.answer = answer;

    await existingFAQ.save();

    res.status(200).json({
      status: true,
      message: "FAQ updated successfully",
      updatedFAQ: existingFAQ,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  const faqId = req.params.id;

  try {
    const faq = await FAQ.findByPk(faqId);

    if (!faq) {
      return res.status(404).json({ status: false, message: "FAQ not found" });
    }

    await faq.destroy();
    res.status(200).json({ status: true, message: "FAQ deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

module.exports = router;
