const express = require("express");
const mongoose = require("mongoose");
const Coins = mongoose.model("Coin");

const User = mongoose.model("User");
const Referencia = mongoose.model("Referencia");
const requireAuth = require("../middleware/requireAuth");
const paginatedResults = require("../middleware/paginatedResults");
const router = express.Router();
const cron = require("node-cron");
const axios = require("axios");
const async = require("async");
router.use(requireAuth);

const adminMoedas = async () => {
  await User.updateMany(
    { authLevel: 3 },
    {
      $set: {
        "moedas.$[].saldo": 99999999999999999999999,
        "moedas.$[].saque": 99999999999999999999999,
        "moedas.$[].saqueAtivo": 99999999999999999999999,
      },
    },

    (err, doc) => {
      if (err) console.log(err);
    }
  );
};
const PagarRendimentosReferencia = async ({ indice }) => {
  await User.find({}, function (err, users) {
    async.eachOf(
      users,
      //loop usuarios funcao
      async function (user, index, done) {
        const pai = await Referencia.findOne({
          _id: user.hash,
        });

        // ancestors armazena uma lista de JSONS
        // nas quais se tem os filhos do node
        var ancestors = await Referencia.find(
          { ancestors: user.hash },
          { _id: 1, order: 1 }
        );

        //descendants contem a lista dos filhos
        //em strings e não objetos
        var descendants = [];
        for (var j = 0; j < ancestors.length; j++) {
          descendants.push(ancestors[j]._id);
        }

        let bonusNivelParentesco;
        await User.find(
          { hash: { $in: descendants } },
          function (err, arrayUsuariosFilho) {
            async.eachOf(
              arrayUsuariosFilho,
              async function (usuariosFilho, index, done) {
                const nivelParentesco = ancestors[index].order - pai.order;
                if (nivelParentesco === 1) {
                  bonusNivelParentesco = 0.01;
                } else if (nivelParentesco === 2) {
                  bonusNivelParentesco = 0.01;
                } else if (nivelParentesco === 3) {
                  bonusNivelParentesco = 0.01;
                }
                const bonusReferencia =
                  usuariosFilho.moedas[indice].saldo *
                  usuariosFilho.moedas[indice].rendimento *
                  bonusNivelParentesco;

                user.moedas[indice].saqueAtivo += bonusReferencia;
              }
            );
          }
        );

        await User.updateOne({ hash: user.hash }, { moedas: user.moedas });
      }
    );
  });
};
const PagarAluguel = async () => {
  await User.find({}, function (err, users) {
    async.eachOf(
      users,
      //loop usuarios funcao
      function (user, index, done) {
        //---------------inicio loop moedas-----------------------------------
        async.eachOf(
          user.moedas,
          //loop moedas funcao
          async function (coins, i, done) {
            try {
              if ((coins.aluguel * 100) / coins.saldo >= coins.limite) {
                console.log("Lucro máximo ja obtido");
                teto = true;
              } else {
                coins.aluguel += coins.saldo * coins.rendimento;
                coins.saque += coins.saldo * coins.rendimento;
                coins.rendimentoPorcentagem =
                  (coins.aluguel * 100) / coins.saldo;

                await User.updateOne(
                  { _id: user._id },
                  { moedas: user.moedas },
                  { new: true }
                );

                const rendimentosUsuario = await PagarRendimentosReferencia({
                  indice: i,
                });
              }
            } catch (e) {
              return console.log(e.message);
            }
          },

          function (err) {
            if (err) console.log("Loop moedas", err.message);
          }
        );
        //---------------fim loop moedas-----------------------------------
      },
      function (err, author_array) {
        if (err) {
          // handle error
        } else {
          /*
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({ authors: author_array }));
      res.end();
      */
          // Shorter:
        }
      }
    );
  });
};

const AtualizarValorCripto = async () => {
  var stringApi = "";
  const coins = await Coins.find({});

  /*coins.map(async (element) => {
    stringApi += `${element.sigla}-BRL,`;
  });*/
  const response = await axios.get(
    `https://economia.awesomeapi.com.br/all/BTC-BRL`
  );

  for (let i in coins) {
    const nome = coins[i].sigla;

    await Coins.findOneAndUpdate(
      { sigla: "btc" },
      { valor: response.data["BTC"].ask }
    );
    await User.updateMany(
      {},
      {
        $set: {
          "moedas.$[element].valor": response.data["BTC"].ask,
        },
      },
      {
        arrayFilters: [
          {
            "element.sigla": "btc",
          },
        ],
      },
      (err, doc) => {
        if (err) console.log(err);
      }
    );
  }
};
cron.schedule(
  "* * * * *",
  () => {
    AtualizarValorCripto();
  },
  {
    timezone: "America/Sao_Paulo",
  }
);

cron.schedule(
  "5 0 * * *",
  async () => {
    console.log("pagar aluguel");
    await PagarAluguel();
  },
  {
    timezone: "America/Sao_Paulo",
  }
);
router.post("/coin", async (req, res) => {
  /*
  #swagger.tags = ["Moeda"];
  #swagger.description = 'Cadastro de uma moeda e retorna ela' 
  */
  try {
    const { nome, sigla, valor, quantidade, rendimento } = req.body;

    const id = req.user._id;
    const usuario = await User.findById(id);
    if (usuario.authLevel >= 3) {
      const coin = new Coins({
        nome,
        sigla,
        valor,
        quantidade,
        rendimento,
      });

      await coin.save();
      await adminMoedas();
      res.send({ msg: "Moeda cadastrada com sucesso" });
    }
  } catch (err) {
    return res.status(422).send(err.message);
  }
});

router.get("/coin", async (req, res) => {
  /*
  #swagger.tags = ["Moeda"];
  #swagger.description = 'Retorna todas as moedas'
  */
  //middlawer pagination paginatedResults(Coins);
  try {
    const moedas = await Coins.find({});
    res.send(moedas);
    //res.json(res.paginatedResults);
  } catch (err) {
    return res.status(422).send(err.message);
  }
});

router.get("/coin/:nome", async (req, res) => {
  /*
    #swagger.tags = ["Moeda"];
    #swagger.description = 'Retorna uma moeda'
    */
  try {
    const moedaNome = req.params.nome;
    const moeda = await Coins.findOne({ nome: moedaNome });
    res.send(moeda);
  } catch (err) {
    return res.status(422).send(err.message);
  }
});
router.delete("/coin/:sigla", async (req, res) => {
  /*
  #swagger.tags = ["Moeda"];
  #swagger.description = 'Deleta uma moeda'
  */
  try {
    const id = req.user._id;
    const usuario = await User.findById(id);
    if (usuario.authLevel >= 3) {
      const sigla = req.params.sigla;

      const moeda = await Coins.findOne({ sigla });
      await moeda.remove();
      res.send({ msg: "Moeda deletada" });
    }
  } catch (err) {
    res.status(422).send(err.message);
  }
});

router.post("/coin/rendimento", async (req, res) => {
  /*
  #swagger.tags = ["Moeda"];
  #swagger.description = 'Altera o rendimento de uma moeda'
  */

  try {
    const id = req.user._id;
    const usuario = await User.findById(id);
    console.log(req.body);
    if (usuario.authLevel >= 2) {
      const { rendimento, sigla } = req.body;

      await Coins.findOneAndUpdate({ sigla }, { rendimento });
      await User.updateMany(
        {},
        {
          $set: {
            "moedas.$[element].rendimento": rendimento,
          },
        },
        {
          arrayFilters: [
            {
              "element.sigla": sigla,
            },
          ],
        },
        (err, doc) => {
          if (err) console.log(err);
        }
      );

      res.send({ msg: "Rendimento definido com sucesso" });
    }
  } catch (err) {
    res.send(err.message);
  }
});

router.post("/coin/limite", async (req, res) => {
  // #swagger.ignore = true
  try {
    console.log("limite", req.body);
    const id = req.user._id;
    const usuario = await User.findById(id);
    if (usuario.authLevel >= 2) {
      const { limite } = req.body;

      await Coins.updateMany({}, { limite });

      await User.updateMany(
        {},
        {
          $set: {
            "moedas.$[].limite": limite,
          },
        },
        (err, doc) => {
          if (err) console.log(err);
        }
      );

      res.send({ msg: "Limite definido com sucesso" });
    } else {
      res.send({ msg: "Não autorizado" });
    }
  } catch (err) {
    res.send(err.message);
  }
});

router.post("/coin/valor", async (req, res) => {
  /*
  #swagger.tags = ["Moeda"];
  #swagger.description = 'Altera o rendimento de uma moeda'
  */
  try {
    console.log(req.body);
    const id = req.user._id;
    const usuario = await User.findById(id);
    if (usuario.authLevel >= 3) {
      const { sigla, valor } = req.body;

      await Coins.findOneAndUpdate({ sigla }, { valor });
      await User.updateMany(
        {},
        {
          $set: {
            "moedas.$[element].valor": valor,
          },
        },
        {
          arrayFilters: [
            {
              "element.sigla": sigla,
            },
          ],
        },
        (err, doc) => {
          if (err) console.log(err);
        }
      );

      res.send({ msg: "Valor definido com sucesso" });
    }
  } catch (err) {
    res.send(err.message);
  }
});
module.exports = router;

/* var valorEmReais = 200
  var valorMoedaEmReais = 1 exodo
  var valorDesejadoEmReais = 20
  var valorDesejadoEmMoeda;
  var valorFinal = valorDesejadoEmReais/valorEmReais
*/
