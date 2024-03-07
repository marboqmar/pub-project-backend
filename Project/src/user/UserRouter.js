const express = require('express');
const router = express.Router();
const UserService = require('./UserService');
const { check, validationResult } = require('express-validator');

router.post(
  '/api/1.0/users',
  check('username').notEmpty().withMessage('Username cannot be null'),
  check('email').notEmpty().withMessage('email cannot be null'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const discoveredErrors = {};
      errors.array().forEach(error => (discoveredErrors[error.path] = error.msg)); // error.param is the key, and the message will be error.msg
      return res.status(400).send({ validationErrors: discoveredErrors });
    }
    await UserService.save(req.body);
    return res.send({ message: 'User created' });
  },
);

module.exports = router;
