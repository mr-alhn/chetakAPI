const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Query = sequelize.define("query", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
  },
  phone: {
    type: DataTypes.STRING,
  },
  query: {
    type: DataTypes.TEXT,
  },
});

module.exports = Query;
