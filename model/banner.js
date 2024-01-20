const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Banner = sequelize.define("banners", {
  image: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Banner;
