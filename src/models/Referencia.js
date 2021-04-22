const mongoose = require("mongoose");

const referenciaSchema = new mongoose.Schema({
  _id: {
    type: String,
  },
  ancestors: {
    type: Array,
  },
  parent: {
    type: String,
  },
  order: {
    type: Number,
  },
  nome: {
    type: String,
  },
});
mongoose.model("Referencia", referenciaSchema);
