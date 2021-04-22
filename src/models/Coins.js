const mongoose = require("mongoose");
const User = mongoose.model("User");
const coinSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    unique: true,
  },
  sigla: {
    type: String,
    unique: true,
  },
  valor: {
    type: Number,
  },
  quantidade: {
    type: Number,
  },
  saldo: {
    type: Number,
    default: 0,
  },
  //rendimento do aluguel
  aluguel: {
    type: Number,
    default: 0,
  },
  rendimento: {
    type: Number,
    default: 0.1,
  },
  saque: {
    type: Number,
    default: 0,
  },
  rendimentoPorcentagem: {
    type: Number,
    default: 0,
  },
  saqueAtivo: {
    type: Number,
    default: 0,
  },
  limite: {
    type: Number,
    default: 100,
  },
});

coinSchema.pre("save", async function (next) {
  const usuario = await User.find();

  usuario.forEach(async (user) => {
    const moedasNovas = [...user.moedas, this];
    await User.updateOne({ _id: user._id }, { moedas: moedasNovas });
  });
  next();
});

coinSchema.pre("remove", async function (next) {
  const usuario = await User.find({});
  usuario.map(async (user) => {
    const teste = user.moedas.filter((moeda) => moeda.sigla !== this.sigla);

    await User.updateOne({ _id: user._id }, { moedas: teste });
  });
  next();
});
mongoose.model("Coin", coinSchema);
