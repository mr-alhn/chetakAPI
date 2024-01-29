const express = require("express");
const router = express.Router();

const Admin = require("../model/admin");

router.post("/create", async (req, res) => {
  try {
    await Admin.create(req.body);

    res.status(200).json({ status: false, message: "Success" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const phone = req.body.phone;

    const admin = await Admin.findOne({ where: { phone } });

    if (!admin) {
      return res
        .status(404)
        .json({ status: true, message: "Incorrect phone number" });
    }

    res.status(200).json({ status: true, message: "Success", admin });
  } catch (e) {
    console.log(e);
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

module.exports = router;
