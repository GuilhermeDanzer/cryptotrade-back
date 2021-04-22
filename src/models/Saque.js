const mongoose = require("mongoose");
const User = mongoose.model("User");

const saqueSchema = new mongoose.Schema({
  moedaNome: {
    type: String,
    required: true,
  },
  valorSacado: {
    type: Number,
    required: true,
  },
  valorTaxa: {
    type: Number,
    required: true,
  },
  valorSaque: {
    type: Number,
    required: true,
  },
  usuarioId: {
    type: String,
    required: true,
  },
  dataSaque: {
    type: Date,
    default: Date.now,
  },
});

saqueSchema.pre("save", async function (next) {
  const usuario = await User.findById(this.usuarioId);

  const saques = [...usuario.saques, this];
  await User.updateOne({ _id: this.usuarioId }, { saques });

  next();
});
mongoose.model("Saque", saqueSchema);
