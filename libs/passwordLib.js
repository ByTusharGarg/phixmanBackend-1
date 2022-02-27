const bcrypt = require('bcrypt');
const saltRounds = 10;

const hashpassword = (myPlaintextPassword) => {
  let salt = bcrypt.genSaltSync(saltRounds);
  let hash = bcrypt.hashSync(myPlaintextPassword, salt);
  return hash;
}

const comparePassword = (oldPassword, hashpassword, cb) => {
  bcrypt.compare(oldPassword, hashpassword, (err, res) => {
    if (err) {
      cb(err, null);
    } else {
      cb(null, res);
    }
  });
};

const comparePasswordSync = (myPlaintextPassword, hash) => {
  return bcrypt.compareSync(myPlaintextPassword, hash);
}

module.exports = {
  hashpassword,
  comparePassword,
  comparePasswordSync
}
