const bcrypt = require('bcrypt');
const User = require('./User');
const save = async (body) => {
  const hash = await bcrypt.hash(body.password, 10); // 10 is the salt rounds number
  const user = { ...body, password: hash }; // gets the email and password from the test post
  await User.create(user);
};

module.exports = { save };
