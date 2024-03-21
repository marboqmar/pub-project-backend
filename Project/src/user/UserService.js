const User = require('./User');
const bcrypt = require('bcrypt');
const crypto = require('crypto'); //crypto provides random strings that will be used to create the activationToken
const EmailService = require('../email/EmailService');

const generateToken = (length) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length); //When generating the string, it generates double the size, so with substring we half it
};

const save = async (body) => {
  const { username, email, password } = body;
  const hash = await bcrypt.hash(password, 10);
  const user = {
    username,
    email,
    password: hash,
    activationToken: generateToken(16),
  };
  await User.create(user);
  await EmailService.sendAccountActivation(email, user.activationToken);
};

const findByEmail = async (email) => {
  return await User.findOne({ where: { email: email } });
};

module.exports = { save, findByEmail };
