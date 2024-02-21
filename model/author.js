const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Author = sequelize.define("authors", {
  name: {
    type: DataTypes.STRING,
  },
  royalty: {
    type: DataTypes.FLOAT,
    allowNull: false,
    default: 0,
  },
  percent: {
    type: DataTypes.FLOAT,
    allowNull: false,
    default: 0,
  },
});

module.exports = Author;
