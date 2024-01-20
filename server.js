const http = require("http");
const apis = require("./routes");
const sequelize = require("./config/db");

const port = 3333;

sequelize.sync();

const server = http.createServer(apis);
server.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
