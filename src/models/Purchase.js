const mongoose = require("mongoose");
const User = mongoose.model("User");
const purchaseSchema = new mongoose.Schema({
  quantidade: {
    type: Number,
    required: true,
  },
  aprovado: {
    type: String,
    default: "Aguardando",
  },
  valor: {
    type: Number,
    required: true,
  },
  moeda: {
    type: String,
    required: true,
  },
  usuarioReceptor: {
    type: Object,
    required: true,
  },
  usuarioEmissor: {
    type: Object,
    required: true,
  },
  operacao: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

purchaseSchema.pre("save", async function (next) {
  const usuario = await User.find();

  usuario.forEach(async (user) => {
    const comprasNovas = [...user.compras, this];
    await User.updateOne(
      { _id: this.usuarioEmissor._id },
      { compras: comprasNovas }
    );
    await User.updateOne(
      { _id: this.usuarioReceptor._id },
      { compras: comprasNovas }
    );
  });
  next();
});
mongoose.model("Purchase", purchaseSchema);
