const http = require("http");
const apis = require("./routes");
const sequelize = require("./config/db");

const port = 3333;

sequelize.sync();
// (async () => {
//   try {
//     await sequelize.sync({ alter: true });
//     console.log("Database synchronized successfully");
//   } catch (error) {
//     console.error("Error synchronizing database:", error);
//   }
// })();

const server = http.createServer(apis);
server.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
