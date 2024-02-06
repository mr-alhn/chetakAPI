const Sequelize = require("sequelize");

//Local
// const sequelize = new Sequelize({
//   dialect: "mysql",
//   username: "root",
//   password: "",
//   database: "chetak",
//   host: "localhost",
//   port: 3306,
// });

//Live
const sequelize = new Sequelize({
  dialect: "mysql",
  username: "u511712962_chetak",
  password: "Alhn@2024",
  database: "u511712962_chetak",
  host: "srv612.hstgr.io",
  port: 3306,
});

module.exports = sequelize;
