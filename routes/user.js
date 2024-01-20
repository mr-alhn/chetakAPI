const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const authenticateToken = require("../middleware/userAuth");

const secretKey = "RGVlcGFrS3VzaHdhaGFBbGhuOTM5OTM2OTg1NA==";

const generateToken = (user) => {
  return jwt.sign(user, secretKey, { expiresIn: "365d" });
};

router.post(
  "/signup",
  [
    check("name").notEmpty().withMessage("Name is required"),
    check("phone").notEmpty().withMessage("Phone is required"),
    check("email").isEmail().withMessage("Invalid email address"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation Error",
        errors: errors.array(),
      });
    }
    const { name, phone, email, password } = req.body;

    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res
        .status(401)
        .json({ status: false, message: "Phone number already exist" });
    }
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res
        .status(401)
        .json({ status: false, message: "Email already exist" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        name,
        phone,
        email,
        password: hashedPassword,
      });

      const token = generateToken({ user: newUser });
      res
        .status(201)
        .json({ status: true, message: "User registered successfully", token });
    } catch (error) {
      console.error(error);
      res.status(500).send({ status: false, message: "Server Error" });
    }
  }
);

router.post("/login", async (req, res) => {
  const { phone, password } = req.body;

  try {
    const user = await User.findOne({ where: { phone } });

    if (!user) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid phone number or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid phone number or password" });
    }

    const token = generateToken({ user });
    res.status(200).json({ status: true, message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.get("/profile", authenticateToken, (req, res) => {
  const user = req.user.user;
  delete user.password;
  res.status(200).json({
    status: true,
    message: "Profile retrieved successfully",
    user: user,
  });
});

router.get("/user/forgot", async (req, res) => {
  const query = req.query.query;

  try {
    if (!query) {
      return res
        .status(500)
        .send({ status: false, message: "query is required" });
    }

    let user;
    const phoneUser = await User.findOne({ where: { phone: query } });
    if (!phoneUser) {
      user = await User.findOne({ where: { email: query } });
    } else {
      user = phoneUser;
    }

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const token = jwt.sign(
      { name: user.name, phone: user.phone, email: user.email },
      secretKey,
      { expiresIn: "4m" }
    );

    res.status(200).json({
      status: true,
      message: "OK",
      user: { name: user.name, phone: user.phone, email: user.email },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: false, message: "Server Error" });
  }
});

router.post("/user/changePassword", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res
        .status(400)
        .json({ status: false, message: "token and password is Required" });
    }

    jwt.verify(token, secretKey, async (err, userDetails) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(403).json({
            status: false,
            message: "Forbidden - Token has expired",
          });
        } else {
          return res
            .status(403)
            .json({ status: false, message: "Forbidden - Invalid token" });
        }
      }

      const phone = userDetails.phone;

      const user = await User.findOne({ where: { phone } });
      if (!user) {
        return res
          .status(404)
          .json({ status: false, message: "User not found" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      user.password = hashedPassword;

      await user.save();
      return res
        .status(200)
        .json({ status: true, message: "Password Changed" });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

router.get("/users/all", async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json({ status: true, message: "OK", users });
  } catch (error) {
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

module.exports = router;
