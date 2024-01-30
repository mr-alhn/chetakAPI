const express = require("express");
const router = express.Router();
const SubAdmin = require("../model/subAdmin");

router.post("/", async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;

    if (!name || !email || !phone || !role) {
      return res
        .status(400)
        .json({ status: false, message: "Required field is missing" });
    }

    let existingAdmin = await SubAdmin.findOne({ where: { phone } });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ status: false, message: "Phone number already exists" });
    }

    existingAdmin = await SubAdmin.findOne({ where: { email } });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ status: false, message: "Email already exists" });
    }

    const admin = await SubAdmin.create(req.body);
    res
      .status(200)
      .json({ status: true, message: "Sub-admin created successfully", admin });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const admins = await SubAdmin.findAll();

    const subAdmins = [];

    for (const admin of admins) {
      subAdmins.push({ ...admin.toJSON(), role: JSON.parse(admin.role) });
    }
    res.status(200).json({ status: true, message: "OK", subAdmins });
  } catch (e) {
    console.log(e);
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const phone = req.body.phone;

    const admin = await SubAdmin.findOne({ where: { phone } });

    if (!admin) {
      return res
        .status(404)
        .json({ status: true, message: "Incorrect phone number" });
    }

    admin.role = JSON.parse(admin.role);

    res
      .status(200)
      .json({ status: true, message: "Success", isAdmin: false, admin });
  } catch (e) {
    console.log(e);
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const subAdmin = await SubAdmin.findByPk(id);

    if (!subAdmin) {
      return res
        .status(404)
        .json({ status: false, message: "Sub admin not found" });
    }

    await subAdmin.distroy();
    res.status(200).json({ status: true, message: "Success" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

module.exports = router;
