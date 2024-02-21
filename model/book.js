const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Book = sequelize.define("books", {
  image: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  author: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sample: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  pdf: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  tag: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  sellPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  isTending: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  isRecommended: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  isPremium: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  subscriptionId: {
    type: DataTypes.INTEGER,
    default: 0,
  },
});

module.exports = Book;
