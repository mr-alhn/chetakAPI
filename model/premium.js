const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Premium = sequelize.define("premiums", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  planId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Premium;
