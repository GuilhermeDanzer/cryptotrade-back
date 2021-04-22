const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = mongoose.model("User");
const Coin = mongoose.model("Coin");
const Referencia = mongoose.model("Referencia");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const router = express.Router();

router.post("/login", async (req, res) => {
  /*
  #swagger.tags = ["Auth"];
  #swagger.description = 'Efetua o login verificando se os campos estão validos'
  */
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(422)
      .send({ error: "Email e senha devem ser preenchidos" });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).send({ error: "Senha ou usuario incorretos" });
  }
  try {
    await user.comparePassword(password);
    res.send({ usuario: true });
  } catch (err) {
    return res.status(400).send({ error: "Senha ou usuário incorretos" });
  }
});

router.post("/register", async (req, res) => {
  /*
  #swagger.tags = ["Auth"];
  #swagger.description = 'Efetua o registro, retorna o qrcode,secret32 e o usuario cadastrado'
  */

  const { nome, email, password, cpf, rg, referenciadoPor } = req.body;

  const moedas = await Coin.find({});
  try {
    const temporary_secret = speakeasy.generateSecret();
    const user = new User({
      nome,
      email,
      password,
      cpf,
      rg,
      referenciadoPor,
      moedas,
      temp_secret: temporary_secret,
    });

    const usuario = await User.findOne({ email });

    if (usuario) {
      return res.status(422).send({ error: "Email já cadastrado" });
    }

    if (await User.findOne({ cpf } || (await User.findOne({ rg })))) {
      return res.status(422).send({ error: "Usuário já cadastrado" });
    }
    await user.save();
    if (!referenciadoPor) {
      const referencia = new Referencia({
        _id: user.hash,
        ancestors: [],
        parent: null,
        order: 0,
        nome,
      });

      await referencia.save();
    } else {
      console.log(user.hash);
      const parent = await Referencia.findOne({ _id: referenciadoPor });
      var ancestorPath = parent.ancestors;
      var order = parent.order + 1;

      ancestorPath.push(referenciadoPor);
      const referencia = new Referencia({
        _id: user.hash,
        ancestors: ancestorPath,
        parent: referenciadoPor,
        order,
        nome,
      });

      await referencia.save();
    }

    const authQRCode = await QRCode.toDataURL(user.temp_secret.otpauth_url);

    res.send({
      secret: temporary_secret.base32,
      authQRCode,
      user,
    });
  } catch (err) {
    return res.status(422).send({ error: err.message });
  }
});

router.post("/verify", async (req, res) => {
  /*
  #swagger.tags = ["Auth"];
  #swagger.description = 'Efetua a verificação do token 2FA do cadastro'
  */
  try {
    const { token2FA, email } = req.body;
    const user = await User.findOne({ email });
    console.log(token2FA);
    const { base32: secret } = user.temp_secret;

    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: token2FA,
      window: 1,
    });
    console.log("verified", verified);
    if (verified) {
      await User.findByIdAndUpdate(user._id, {
        $rename: { temp_secret: "secret" },
      });
      const token = jwt.sign({ userId: user._id }, "I_miei_figli_eplenýän");
      res.send({ verified: true, token });
    } else {
      res.send({ verified: false });
    }
  } catch (error) {
    console.log(error.message);
  }
});
router.post("/validate", async (req, res) => {
  /*
  #swagger.tags = ["Auth"];
  #swagger.description = 'Efetua a validação do token 2FA do login'
  */
  try {
    const { token2FA, email } = req.body;

    const user = await User.findOne({ email });
    const usuario = user.toObject();
    const { base32: secret } = usuario.secret;
    const tokenValidates = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: token2FA,
      window: 1,
    });

    const token = jwt.sign({ userId: user._id }, "I_miei_figli_eplenýän");

    if (tokenValidates) {
      res.send({ validated: true, token });
    } else {
      res.send({ validated: false });
    }
  } catch (error) {}
});
module.exports = router;
