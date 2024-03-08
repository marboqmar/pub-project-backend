const express = require('express');
const router = express.Router();
const UserService = require('./UserService');
const { check, validationResult } = require('express-validator');

router.post(
  '/api/1.0/users',
  check('username')
    .notEmpty()
    .withMessage('Username cannot be null')
    // bail means that if the previous condition (notEmpty) is not met, the bail will act as a return and the following condition will not be checked
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('Must have minimum 4 and maximum 32 characters'),
  check('email')
    .notEmpty()
    .withMessage('E-mail cannot be null')
    .bail()
    .isEmail()
    .withMessage('E-mail is not valid'),
  check('password')
    .notEmpty()
    .withMessage('Password cannot be null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .bail()
    .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).*$/)
    .withMessage(
      'Password must have at least one uppercase, one lowercase and one number',
    ),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const discoveredErrors = {};
      errors
        .array()
        .forEach((error) => (discoveredErrors[error.path] = error.msg)); // error.param is the key, and the message will be error.msg
      return res.status(400).send({ validationErrors: discoveredErrors });
    }
    try {
      await UserService.save(req.body);
      return res.send({ message: 'User created' });
    } catch (err) {
      /*The err parameter is not used anywhere */
      return res
        .status(400)
        .send({ validationErrors: { email: 'E-mail in use' } });
    }
  },
);

module.exports = router;
