const express = require("express");
const app = express();
app.use(express.json());
const cors = require("cors");

const validVerificationKeys = [
  "RGVlcGFrS3VzaHdhaGE5Mzk5MzY5ODU0",
  "RGVlcGFrS3VzaHdhaGE5Mzk5MzY5ODU0QWxoblBvb2ph",
];

// const validateVerificationKey = (req, res, next) => {
//   const verificationKey = req.headers["verifyme"];

//   if (!verificationKey || !validVerificationKeys.includes(verificationKey)) {
//     return res.status(403).json({
//       status: false,
//       message: "Access Denied🙅",
//     });
//   }

//   next();
// };

const validateVerificationKey = (req, res, next) => {
  const verificationKey = req.headers["verifyme"];
  const imageUrl = req.url;

  if (
    (verificationKey && validVerificationKeys.includes(verificationKey)) ||
    imageUrl.includes("/uploads/")
  ) {
    next();
  } else {
    return res.status(403).json({
      status: false,
      message: "Access Denied🙅",
    });
  }
};

app.use(validateVerificationKey);
app.use(cors());
app.use("/uploads", express.static(__dirname + "/uploads"));

//
app.use("/", require("./routes/user"));
app.use("/banners", require("./routes/banner"));
app.use("/coupon", require("./routes/coupon"));
app.use("/faq", require("./routes/faqs"));
app.use("/book", require("./routes/book"));
app.use("/plan", require("./routes/plan"));
app.use("/rate", require("./routes/rating"));
app.use("/cart", require("./routes/cart"));
app.use("/favorite", require("./routes/favorite"));
app.use("/library", require("./routes/library"));
app.use("/premium", require("./routes/premium"));

//Helper
app.use("/", require("./utils/helper"));

//Handle Wrong URL
app.use((req, res) => {
  res.status(404).json({ status: false, message: "Route not found" });
});

module.exports = app;
