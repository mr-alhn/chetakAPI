const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Order = sequelize.define("orders", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  discount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  finalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  traId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM("book", "plan"),
    allowNull: false,
    default: "book",
  },
});

module.exports = Order;
