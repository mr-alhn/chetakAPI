const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Favorite = sequelize.define("favorites", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  bookId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Favorite;
