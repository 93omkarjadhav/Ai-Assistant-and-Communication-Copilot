const crypto = require('crypto');

function generateCookiePassword() {
  return crypto.randomBytes(64).toString('hex');
}

console.log('Generated Cookie Password:', generateCookiePassword());
