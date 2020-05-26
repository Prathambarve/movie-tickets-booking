'use strict';

const util = require('util');
const crypto = require('crypto');

const pbkdf2Promise = util.promisify(crypto.pbkdf2);

const genSalt = () => {
  return crypto.randomBytes(16).toString('hex');
};

const hashPassword = async (password, salt) => {
  const hash = await pbkdf2Promise(password, salt, 1000, 64, 'sha512');
  return hash.toString('hex');
};

module.exports = { genSalt, hashPassword };
