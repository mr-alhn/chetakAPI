const http = require("http");
const https = require("https");
const apis = require("./routes");
const fs = require("fs");
const sequelize = require("./config/db");

const port = 3333;
const PORT_HTTPS = 3443;

sequelize.sync();

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

const httpsServer = https.createServer(credentials, apis);

httpsServer.listen(PORT_HTTPS, () => {
  console.log(`HTTPS Server running on port ${PORT_HTTPS}`);
});
