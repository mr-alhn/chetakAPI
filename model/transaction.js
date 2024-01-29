const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Transaction = sequelize.define("transactions", {
  type: {
    type: DataTypes.STRING,
  },
  traId: {
    type: DataTypes.STRING,
  },
});

module.exports = Transaction;
