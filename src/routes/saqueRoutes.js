const express = require("express");
const mongoose = require("mongoose");
const Coins = mongoose.model("Coin");
const User = mongoose.model("User");
const Saque = mongoose.model("Saque");
const requireAuth = require("../middleware/requireAuth");
const router = express.Router();

router.use(requireAuth);

router.get("/sacar/all", async (req, res) => {
  /*
  #swagger.tags = ["Saque"];
  #swagger.description =  'Retorna todos os saques'
  */
  try {
    const id = req.user._id;
    const usuario = User.findById({ id });

    if (usuario.authLevel >= 2) {
      const { taxa } = req.body;

      const saque = await Saque.find({});

      return res.send(saque);
    } else {
      return res.send({ msg: "Você não tem autorização" });
    }
  } catch (err) {
    return res.status(422).send({ error: err.message });
  }
});

router.get("/sacar", async (req, res) => {
  /*
  #swagger.tags = ["Saque"];
  #swagger.description =  'Retorna os saques do usuario'
  */
  try {
    const saque = await Saque.find({ usuarioId: req.user._id });
    return res.send(saque);
  } catch (err) {
    return res.status(422).send({ error: err.message });
  }
});
router.get("/sacar/:id", async (req, res) => {
  /*
  #swagger.tags = ["Saque"];
  #swagger.description =  'Retorna o saque pelo Id do saque'
  */
  try {
    const id = req.params.id;
    const saque = await Saque.find({ usuarioId: id });
    return res.send(saque);
  } catch (err) {
    return res.status(422).send({ error: err.message });
  }
});
router.post("/sacar", async (req, res) => {
  /*
  #swagger.tags = ["Saque"];
  #swagger.description =  'Efetua o saque'
  */
  try {
    var msg = "Saque efetuado";
    const { moedaNome, valorSaque } = req.body;
    const id = req.user._id;

    const usuario = await User.findById(id);
    const valorTaxa = usuario.taxa * valorSaque;
    const valorSacado = valorSaque - valorTaxa;
    usuario.moedas.map((element) => {
      if (element.nome === moedaNome) {
        element.saqueAtivo += valorSacado;
        element.saque = 0;
      }
    });
    const saque = new Saque({
      moedaNome,
      valorSaque,
      valorTaxa,
      valorSacado,
      usuarioId: id,
    });
    await User.findByIdAndUpdate(id, usuario);

    await saque.save();
    return res.send({ msg });
  } catch (err) {
    return res.status(422).send({ error: err.message });
  }
});

module.exports = router;
