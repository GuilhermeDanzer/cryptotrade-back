const swaggerAutogen = require("swagger-autogen")({ language: "pt-BR" });
const doc = {
  info: {
    title: "API Cryptocoin Exodo",
    description: "Description",
  },
  host: "",
  schemes: ["https"],
  basePath: "/",
  schemes: ["http", "https"],
  consumes: ["application/json"],
  produces: ["application/json"],
};

const outputFile = "./swagger_output.json";
const endpointsFiles = [
  "./src/routes/authRoutes.js",
  "./src/routes/coinsRoutes.js",
  "./src/routes/paymentRoute.js",
  "./src/routes/saqueRoutes.js",
  "./src/routes/usersRoutes.js",
  "./src/routes/referenciaRoutes.js",
];
swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require("./index.js");
});
