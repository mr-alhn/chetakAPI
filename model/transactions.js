const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Transaction = sequelize.define("transactions", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    default: 0,
  },
  title: {
    type: DataTypes.STRING,
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Transaction;
