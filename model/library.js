const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Library = sequelize.define("libraries", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  bookId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  purchasedFrom: {
    type: DataTypes.ENUM("Subscriptions", "E-Com"),
    allowNull: false,
    default: "E-Com",
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Library;
