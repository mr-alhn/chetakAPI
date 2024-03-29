const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Plan = sequelize.define("plans", {
  image: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  benefits: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  durationTitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  finalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  savePercent: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Plan;
