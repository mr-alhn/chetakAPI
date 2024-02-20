const jwt = require("jsonwebtoken");

const secretKey = "RGVlcGFrS3VzaHdhaGFBbGhuOTM5OTM2OTg1NA==";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const url = req.url;

  if (!authHeader) {
    if (url.includes("/plans") || url.includes("/books")) {
      return next();
    }
    return res.status(401).json({ status: false, message: "Access Denied" });
  }

  const tokenList = authHeader && authHeader.split(" ");
  const tokenVerify = tokenList[0];

  if (tokenVerify !== "A-Verify") {
    return res.status(401).json({ status: false, message: "Access Denied" });
  }

  const token = tokenList[1];
  if (!token) {
    return res
      .status(401)
      .json({ status: false, message: "Unauthorized - Token not provided" });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(403)
          .json({ status: false, message: "Forbidden - Token has expired" });
      } else {
        return res
          .status(403)
          .json({ status: false, message: "Forbidden - Invalid token" });
      }
    }

    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
