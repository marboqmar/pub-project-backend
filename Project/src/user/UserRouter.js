const express = require('express');
const UserService = require('./UserService');
const router = express.Router();
const { check, validationResult } = require('express-validator');

router.post(
  '/api/1.0/users',
  check('username')
    .notEmpty()
    .withMessage('username_null')
    // bail means that if the previous condition (notEmpty) is not met, the bail will act as a return and the following condition will not be checked
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('username_size'),
  check('email')
    .notEmpty()
    .withMessage('email_null')
    .bail()
    .isEmail()
    .withMessage('email_invalid')
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);
      if (user) {
        throw new Error('email_in_use');
      }
    }),
  check('password')
    .notEmpty()
    .withMessage('password_null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('password_size')
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('password_pattern'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = {};
      errors
        .array()
        .forEach((error) => (validationErrors[error.path] = req.t(error.msg))); // error.param is the key, and the message will be error.msg
      return res.status(400).send({ validationErrors: validationErrors });
    }
    await UserService.save(req.body);
    return res.send({ message: req.t('user_create_success') });
  },
);

module.exports = router;
