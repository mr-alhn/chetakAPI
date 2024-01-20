// coupon.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Coupon = sequelize.define("coupons", {
  coupon: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.ENUM("fixed", "percent"),
    allowNull: false,
  },
  qty: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
  },
});

module.exports = Coupon;
