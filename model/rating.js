const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Rating = sequelize.define("ratings", {
  bookId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rate: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  review: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = Rating;
