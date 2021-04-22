const express = require("express");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const paginatedResults = require("../middleware/paginatedResults");

router.use(requireAuth);

router.get("/users/all", async (req, res) => {
  /*
  #swagger.tags = ["Usuario"];
  #swagger.description =  'Retorna todos os usuarios'
  */
  try {
    const response = await User.find({}, "nome moedas email");
    res.send(response);
  } catch (err) {
    return res.send({ error: err.message });
  }
});

router.get("/users", paginatedResults(User), async (req, res) => {
  /*
  #swagger.tags = ["Usuario"];
  #swagger.description =  'Retorna todos os usuarios, somente admin'
  */
  try {
    const id = req.user._id;
    const usuario = await User.findById(id);

    if (usuario.authLevel >= 2) {
      res.json(res.paginatedResults);
    } else {
      res.json({ msg: "Você não tem permissão para acessar" });
    }
    // const resultadosLista = res.paginatedResults.results;
    //console.log(resultadosLista.filter((teste) => teste.cpf === "123123123"));
  } catch (err) {
    return res.send({ error: err.message });
  }
});
router.get("/user/:id", async (req, res) => {
  /*
  #swagger.tags = ["Usuario"];
  #swagger.description =  'Retorna os dados de um usuario'
  */
  try {
    const id = req.params.id;
    const response = await User.findById(id);
    res.send(response);
  } catch (err) {
    return res.send({ error: err.message });
  }
});
router.get("/user", async (req, res) => {
  /*
  #swagger.tags = ["Usuario"];
  #swagger.description =  'Retorna os dados do usuario atual'
  */
  try {
    const id = req.user._id;

    const response = await User.findById(id);
    res.send(response);
  } catch (err) {
    return res.send({ error: err.message });
  }
});

router.post("/taxaSaque", async (req, res) => {
  /*
  #swagger.tags = ["Usuario"];
  #swagger.description =  'Define a taxa do saque'
  */
  try {
    const id = req.user._id;
    const usuario = User.findById({ id });

    if (usuario.authLevel >= 2) {
      const { taxa } = req.body;

      await User.updateMany({}, { taxa });
      res.send({ msg: "Taxa modificada para " + bonus * 100 + "%" });
    } else {
      res.json({ msg: "Você não tem permissão para acessar" });
    }
  } catch (err) {
    return res.send({ error: err.message });
  }
});

router.post("/userAuth", async (req, res) => {
  /*
  #swagger.tags = ["Usuario"];
  #swagger.description =  'Define a autoridade'
  */
  try {
    const { usuarioId, authLevel } = req.body;
    const id = req.user._id;

    const usuario = await User.findById(id);
    if (usuario._id === usuarioId) {
      res.send({ msg: "Você não pude mudar sua própria autoridade" });
    } else if (usuario.authLevel >= 3) {
      await User.updateOne({ _id: usuarioId }, { authLevel });

      res.send({ msg: "Permissões do usuário redefinidas" });
    } else {
      res.send({ msg: "Você não tem permissão para isso" });
    }
  } catch (err) {
    return res.send({ error: err.message });
  }
});

router.post("/deleteUser/:id", async (req, res) => {
  /*
  #swagger.tags = ["Usuario"];
  #swagger.description =  'Deleta um usuario'
  */
  try {
    const id = req.user._id;
    const usuario = await User.findById(id);

    if (usuario.authLevel >= 3) {
      const id = req.params.id;
      const userDelete = await User.findOne({ _id: id });
      if (userDelete.referenciadoPor) {
        const usuarioReferencia = User.findOne({
          cpf: userDelete.referenciadoPor,
        });
        await User.updateOne(usuarioReferencia, {
          $pull: { referenciados: userDelete.cpf },
        });
      }

      await userDelete.remove();
      res.send({ msg: "Usuário deletado com sucesso" });
    } else {
      res.send({ msg: "Você não tem permissão" });
    }
  } catch (err) {
    return res.send({ message: "Usuario não encontrado" });
  }
});
module.exports = router;
