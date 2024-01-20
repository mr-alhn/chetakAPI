const Sequelize = require("sequelize");

//Local
const sequelize = new Sequelize({
  dialect: "mysql",
  username: "root",
  password: "",
  database: "chetak",
  host: "localhost",
  port: 3306,
});

module.exports = sequelize;
