const express = require("express");
const mongoose = require("mongoose");
const Coins = mongoose.model("Coin");
const User = mongoose.model("User");
const Referencia = mongoose.model("Referencia");
const requireAuth = require("../middleware/requireAuth");
const router = express.Router();

router.get("/referenciados/:hash", async (req, res) => {
  /*
  #swagger.tags = ["Referenciados"];
  #swagger.description =  'Retorna os referenciados de um usuario pela hash'
  */
  try {
    const hash = req.params.hash;
    var ancestors = await Referencia.find({ ancestors: hash });
    var pai = await Referencia.find({ _id: hash });
    console.log("pai", pai[0]);
    var descendants = [];
    for (var i = 0; i < ancestors.length; i++) {
      if (ancestors[i].order - pai[0].order <= 3) {
        descendants.push({
          _id: ancestors[i]._id,
          nome: ancestors[i].nome,
          order: ancestors[i].order,
        });
      }
    }
    res.send(descendants);
  } catch (err) {
    return res.status(422).send({ error: err.message });
  }
});

module.exports = router;
