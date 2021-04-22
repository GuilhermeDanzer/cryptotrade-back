require("./models/User");
require("./models/Coins");
require("./models/Purchase");
require("./models/Saque");
require("./models/Referencia");
const express = require("express");
var cors = require("cors");

const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const coinsRoutes = require("./routes/coinsRoutes");
const usersRoutes = require("./routes/usersRoutes");
const paymentRoutes = require("./routes/paymentRoute");
const saqueRoutes = require("./routes/saqueRoutes");
const referenciaRoutes = require("./routes/referenciaRoutes");
const cron = require("node-cron");
const app = express();
const swaggerJsDocs = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

require("dotenv/config");
const swaggerFile = require("../swagger_output.json");
app.use(cors());
app.options("*", cors());
app.use(bodyParser.json());
// SWAGGER
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

//FIM SWAGGER
app.get("/", (req, res) => {
  res.send("Rota funcionando");
});

app.use(referenciaRoutes);
app.use(authRoutes);
app.use(coinsRoutes);
app.use(paymentRoutes);
app.use(usersRoutes);
app.use(saqueRoutes);

const mongoUri = process.env.URL_PROD;
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
mongoose.connection.on("connected", () => {
  console.log("Connected mongo instance");
});

mongoose.connection.on("error", (err) => {
  console.log("Error", err);
});

app.listen(process.env.PORT_DEV, () => {
  console.log("Listening on 8080");
});
