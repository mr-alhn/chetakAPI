const http = require("http");
const https = require("https");
const apis = require("./routes");
const sequelize = require("./config/db");

const port = 3333;
const PORT_HTTPS = 3443;

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

const privateKeyPath = "/home/ubuntu/chetak/private.key";
const certificatePath = "/home/ubuntu/chetak/certificate.crt";
const caPath = "/home/ubuntu/chetak/ca_bundle.crt";

const credentials = {
  key: fs.readFileSync(privateKeyPath, "utf8"),
  cert: fs.readFileSync(certificatePath, "utf8"),
  ca: fs.readFileSync(caPath, "utf8"),
};

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT_HTTPS, () => {
  console.log(`HTTPS Server running on port ${PORT_HTTPS}`);
});
