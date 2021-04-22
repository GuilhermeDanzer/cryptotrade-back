const express = require("express");
const mongoose = require("mongoose");
const Coin = mongoose.model("Coin");
const User = mongoose.model("User");
const Purchase = mongoose.model("Purchase");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");

router.use(requireAuth);

router.get("/userPurchase/:id", async (req, res) => {
  /*
  #swagger.tags = ["Compras"];
  #swagger.description = 'Retorna as operações feita por um usuario'
  */
  try {
    const id = req.user._id;
    const usuario = User.findById({ id });

    if (usuario.authLevel === 3) {
      res.send(usuario);
    } else {
      res.status(422);
    }
  } catch (err) {}
});

router.get("/getPurchase", async (req, res) => {
  /*
  #swagger.tags = ["Compras"];
  #swagger.description = 'Retorna as operações feita pelo usuario'
  */
  try {
    const id = req.user._id;
    console.log(id);
    const response = await Purchase.find({
      $or: [{ "usuarioEmissor._id": id }, { "usuarioReceptor._id": id }],
      function(err, docs) {
        if (!err) console.log(docs);
      },
    });

    res.send(response);
  } catch (err) {
    return res.send({ error: err.message });
  }
});
router.get("/getPurchase/:operacao", async (req, res) => {
  /*
  #swagger.tags = ["Compras"];
  #swagger.description = 'Retorna as operações feita por um usuario. Comprar, vender ou geral'
  */
  try {
    const id = req.user._id;
    const operacao = req.params.operacao;
    if (operacao === "geral") {
      const response = await Purchase.find({
        $or: [{ "usuarioEmissor._id": id }, { "usuarioReceptor._id": id }],

        function(err, docs) {
          if (!err) console.log(docs);
        },
      });
      res.send(response);
    } else {
      const response = await Purchase.find({
        $or: [{ "usuarioEmissor._id": id }, { "usuarioReceptor._id": id }],
        $and: [{ operacao: operacao }],
        function(err, docs) {
          if (!err) console.log(docs);
        },
      });
      res.send(response);
    }
  } catch (err) {
    return res.send({ error: err.message });
  }
});

router.get("/purchase/all", async (req, res) => {
  try {
    /*
  #swagger.tags = ["Compras"];
  #swagger.description =  'Retorna todas as operações'
  */
    const response = await Purchase.find({});
    res.send(response);
  } catch (err) {
    return res.send({ error: err.message });
  }
});

router.post("/purchase", async (req, res) => {
  /*
  #swagger.tags = ["Compras"];
  #swagger.description =  'Registra uma operação. comprar ou vender'
  */
  try {
    const { operacao, usuario, moeda, quantidade, valor } = req.body;
    const id = req.user._id;
    const usuarioReceptor = await User.findOne(
      { email: usuario },
      "nome email moedas"
    );
    const usuarioEmissor = await User.findById(id, "nome email moedas");

    const compra = new Purchase({
      operacao,
      moeda: moeda.nome,
      usuarioReceptor,
      usuarioEmissor,
      quantidade,
      valor,
    });

    if (operacao === "vender") {
      usuarioEmissor.moedas.map(async (element) => {
        if (element.nome === moeda.nome) {
          if (quantidade > element.saqueAtivo * 0.9) {
            res.send({
              msg: `Saldo ativo insuficiente venda uma quantidade menor de moedas`,
            });
          } else {
            await compra.save();
            res.send({
              msg: "A operação foi efetuada, aguardando confirmação",
            });
          }
        }
      });
    } else if (operacao === "comprar") {
      usuarioReceptor.moedas.map(async (element) => {
        if (element.nome === moeda.nome) {
          if (quantidade > element.saqueAtivo * 0.9) {
            res.send({
              msg: `Saldo ativo do usuario o qual você está tentando comprar é insuficiente`,
            });
          } else {
            await compra.save();
            res.send({
              msg: "A operação foi efetuada, aguardando confirmação",
            });
          }
        }
      });
    } else {
      res.send({ msg: "Operação invalida" });
    }
  } catch (err) {
    console.log(err.message);
    return res.send({ error: err.message });
  }
});
router.post("/payment/comprar", async (req, res) => {
  /*
  #swagger.tags = ["Compras"];
  #swagger.description =  'Confirma uma compra'
  */
  try {
    const { _id, usuarioEmissor } = req.body;
    // Usuario Emissor = pessoa que fez a ordem de compra
    const compra = await Purchase.findById(_id);

    const id = req.user._id;
    //id = id da pessoa que vendeu as moedas compradas
    const comprador = await User.findOne(
      { email: usuarioEmissor.email },
      "nome email moedas"
    );
    //Vendedor das moedas compradas, sai dele pro comprador
    const vendedor = await User.findOne({ _id: id }, "nome email moedas");
    var saldoInsuficiente = false;
    vendedor.moedas.map(async (element) => {
      if (element.nome === compra.moeda && compra.aprovado === "Aguardando") {
        if (
          element.saqueAtivo - compra.quantidade >=
          element.saqueAtivo * 0.1
        ) {
          element.saqueAtivo -= compra.quantidade;
        } else {
          saldoInsuficiente = true;
        }
      }
    });
    comprador.moedas.map(async (element) => {
      if (element.nome === compra.moeda && compra.aprovado === "Aguardando") {
        if (saldoInsuficiente === false) {
          element.saldo += compra.quantidade;
          if (comprador.primeiraCompra === false) {
            comprador.primeiraCompra = true;
            const referenciador = await User.findOne({
              hash: comprador.referenciadoPor,
            });
            referenciador.moedas.map((moedasReferenciador) => {
              if (moedasReferenciador.nome === compra.moeda) {
                moedasReferenciador.saqueAtivo += compra.quantidade * 0.3;
              }
            });

            await User.findByIdAndUpdate(referenciador._id, {
              moedas: referenciador.moedas,
            });
          }
        }
      }
    });

    if (saldoInsuficiente === true) {
      res.send({ msg: "Saldo insuficiente" });
    } else if (compra.aprovado === "Aguardando") {
      vendedor.compras.map(async (element) => {
        if (element._id == _id) {
          element.aprovado = "Aprovado";
        }
      });

      comprador.compras.map(async (element) => {
        if (element._id == _id) {
          element.aprovado = "Aprovado";
        }
      });

      await User.findByIdAndUpdate(
        id,
        { moedas: vendedor.moedas },
        { compras: vendedor.compras }
      );
      //c
      await User.findOne(
        { email: usuarioEmissor.email },
        { moedas: comprador.moedas },
        { compras: comprador.compras },
        { primeiraCompra: comprador.primeiraCompra }
      );
      res.send({ msg: "As moedas foram entregues" });
    } else if (compra.aprovado === "Aprovado") {
      res.send({ msg: "Essa compra ja foi aprovada" });
    } else {
      vendedor.compras.map(async (element) => {
        if (element._id === _id) {
          element.aprovado === "Recusado";
        }
      });

      comprador.compras.map(async (element) => {
        if (element._id === _id) {
          element.aprovado === "Recusado";
        }
      });
      res.send({ msg: "Essa compra ja foi recusada" });
    }
  } catch (err) {
    return res.send({ error: err.message });
  }
});

router.post("/payment/vender", async (req, res) => {
  /*
  #swagger.tags = ["Compras"];
  #swagger.description =  'Confirma uma venda'
  */
  try {
    const { _id, usuarioReceptor } = req.body;

    const compra = await Purchase.findById(_id);

    const id = req.user._id;
    const vendedor = await User.findOne(
      { _id: id },
      "nome email moedas compras"
    );
    const comprador = await User.findOne(
      { email: usuarioReceptor.email },
      "nome email moedas compras"
    );
    var saldoInsuficiente = false;
    vendedor.moedas.map(async (element) => {
      if (element.nome === compra.moeda && compra.aprovado === "Aguardando") {
        if (
          element.saqueAtivo - compra.quantidade >=
          element.saqueAtivo * 0.1
        ) {
          element.saqueAtivo -= compra.quantidade;
        } else {
          saldoInsuficiente = true;
        }
      }
    });
    comprador.moedas.map(async (element) => {
      if (element.nome === compra.moeda && compra.aprovado === "Aguardando") {
        if (saldoInsuficiente === false) {
          element.saldo += compra.quantidade;
        }
      }
    });

    if (saldoInsuficiente === true) {
      res.send({ msg: "Saldo insuficiente" });
    } else if (compra.aprovado === "Aguardando") {
      vendedor.compras.map(async (element) => {
        if (element._id == _id) {
          element.aprovado = "Aprovado";
        }
      });

      comprador.compras.map(async (element) => {
        if (element._id == _id) {
          element.aprovado = "Aprovado";
        }
      });

      await User.findByIdAndUpdate(id, { moedas: vendedor.moedas });
      await User.findOneAndUpdate(
        { email: usuarioReceptor.email },
        { moedas: comprador.moedas }
      );
      await Purchase.findByIdAndUpdate(_id, {
        aprovado: "Aprovado",
      });
      res.send({ msg: "As moedas foram entregues" });
    } else if (aprovado === "Aprovado") {
      res.send({ msg: "Essa compra ja foi aprovada" });
    } else {
      vendedor.compras.map(async (element) => {
        if (element._id === _id) {
          element.aprovado === "Recusado";
        }
      });

      comprador.compras.map(async (element) => {
        if (element._id === _id) {
          element.aprovado === "Recusado";
        }
      });
      res.send({ msg: "Essa compra ja foi recusada" });
    }
  } catch (err) {
    return res.send({ error: err.message });
  }
});

router.post("/payment/recusar", async (req, res) => {
  /*
  #swagger.tags = ["Compras"];
  #swagger.description =  'Rejeita uma compra ou venda'
  */
  try {
    const { _id } = req.body;
    await Purchase.findByIdAndUpdate(_id, { aprovado: "Recusado" });
    res.send({ msg: "Transição recusada" });
  } catch (err) {
    res.send({ msg: err });
  }
});
module.exports = router;
