const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SubAdmin = sequelize.define("subAdmin", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  notificationToken: {
    type: DataTypes.STRING,
  },
});

module.exports = SubAdmin;
