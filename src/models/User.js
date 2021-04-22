const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { randomBytes } = require("crypto");
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  authLevel: {
    type: Number,
    required: true,
    default: 1,
  },
  temp_secret: {
    type: Object,
  },
  cpf: {
    type: String,
    required: true,
    unique: true,
  },
  rg: {
    type: String,
    required: true,
    unique: true,
  },

  nome: {
    type: String,
    required: true,
  },
  moedas: {
    type: [],
    required: true,
  },
  referenciadoPor: {
    type: String,
  },
  compras: {
    type: [],
    default: [],
  },
  bonus: {
    type: Number,
    default: 0.02,
  },
  primeiraCompra: {
    type: Boolean,
    default: false,
  },
  hash: {
    type: String,
  },
  saques: {
    type: [],
  },
  taxa: {
    type: Number,
    default: 0.1,
  },
});

userSchema.pre("save", function (next) {
  const user = this;

  user.hash = randomBytes(20).toString("hex");
  if (!user.isModified("password")) {
    return next;
  }

  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }

    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;

      next();
    });
  });
});

userSchema.methods.comparePassword = function (candidatePassword) {
  const user = this;

  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, user.password, (err, isMatch) => {
      if (err) {
        return reject(err);
      }

      if (!isMatch) {
        return reject(false);
      }

      resolve(true);
    });
  });
};

mongoose.model("User", userSchema);
