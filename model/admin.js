const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Admin = sequelize.define("admin", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Admin;
