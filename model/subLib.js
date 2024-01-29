const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SubLib = sequelize.define("subLibrary", {
  userId: {
    type: DataTypes.INTEGER,
  },
  bookId: {
    type: DataTypes.INTEGER,
  },
  planId: {
    type: DataTypes.INTEGER,
  },
});

module.exports = SubLib;
