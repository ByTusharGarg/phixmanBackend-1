const { isEmpty, trim, isEmail, isStrong } = require("../libs/checkLib");
const { hashpassword, comparePasswordSync } = require("../libs/passwordLib");
const jwt = require("jsonwebtoken");
const { Admin, Counters } = require("../models");

const registerAdmin = async (req, res) => {
  req.body.name = trim(req?.body?.name);
  req.body.email = trim(req?.body?.email).toLowerCase();
  req.body.pswd = trim(req?.body?.pswd);
  if (!isEmail(req?.body?.email)) {
    return res.status(404).json({
      message: "InValid Email",
    });
  }
  if (!isStrong(req?.body?.pswd)) {
    return res.status(404).json({
      message: "Password is not Strong Enough",
    });
  }
  try {
    // let admins = await Admin.countDocuments({})
    let counterValue = await Counters.findOneAndUpdate(
      { name: "admins" },
      { $inc: { seq: 1 } },
      { new: true }
    );
    if (!counterValue) {
      counterValue = await Counters.create({ name: "admins" });
      // console.log(counterValue)
    }
    await Admin.create({
      Sno: counterValue.seq, //admins + 1,
      Name: req?.body?.name,
      email: req?.body?.email,
      password: hashpassword(req?.body?.pswd),
    });
    //send activation mail here
    return res.status(201).json({
      message: "Admin Registration successfull",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Try again later !!!",
    });
  }
};
const adminLogin = (req, res) => {
  if (isEmpty(req.body.username) || isEmpty(req.body.password)) {
    return res.json({
      success: false,
      message: "Credentials missing",
    });
  } else {
    let username = trim(req.body.username.toString().toLowerCase());
    let password = trim(req.body.password);
    Admin.findOne(
      { email: username, isVerified: true, isActive: true, isPublished: true },
      (err, admin) => {
        if (admin && comparePasswordSync(password, admin?.password)) {
          let token = jwt.sign(
            { userID: admin._id, type: "admin" },
            process.env.Secret,
            {
              expiresIn: "24h", // expires in 24 hours
            }
          );
          return res.status(200).json({
            success: true,
            message: "Authentication successful!",
            token: token,
          });
        } else {
          return res.status(401).json({
            success: false,
            message: "Invalid Credentials",
          });
        }
      }
    );
  }
};
const checkAdmin = (req, res, next) => {
  let token = trim(req.headers["authorization"]);
  if (!isEmpty(token)) {
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length);
    }
    jwt.verify(token, process.env.Secret, (err, decoded) => {
      req.decoded = decoded;
      if (decoded) {
        Admin.findOne(
          {
            _id: decoded.userID,
            isVerified: true,
            isActive: true,
            isPublished: true,
          },
          (err, admin) => {
            if (admin) {
              req.admin = admin;
              next();
            } else {
              return res.status(401).json({
                success: false,
                message: "Unauthenticated Access",
              });
            }
          }
        );
      } else {
        return res.status(401).json({
          success: false,
          message: "Unauthenticated Access",
        });
      }
    });
  } else {
    return res.status(404).json({
      success: false,
      message: "Auth token is not supplied",
    });
  }
};

const resetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "email required",
    })
  }

  try {
    const resp = await Admin.findOne({ email });
    let token;

    if (resp) {
      token = jwt.sign(
        { userID: resp._id, email, type: "admin" },
        process.env.CHNAGE_PASSWORD_SECRET,
        {
          expiresIn: "8hr", // expires in 24 hours
        }
      );
    }
    return res.status(200).json({
      success: true,
      message: "Reset password instructions sent on your mail successfully valid till 8hr",
      token
    });

  } catch (error) {
    return res.status(500).json({
      message: "Try again later !!!",
    });
  }
}

const changePassword = async (req, res) => {
  const { token, newpassword } = req.body;

  if (!newpassword || !token) {
    return res.status(400).json({
      message: "token newpassword required",
    })
  }

  try {

    const data = await jwt.verify(token, process.env.CHNAGE_PASSWORD_SECRET);

    if (data) {
      if (data.type === 'admin') {
        const resp = await Admin.findOneAndUpdate({ email: data.email }, { password: hashpassword(newpassword) }, { new: true });
        if (resp) {
          return res.status(200).json({
            message: "Password Changed successfully",
          });
        } else {
          return res.status(404).json({
            message: "Token expired or invalid",
          })
        }
      }
    } else {
      return res.status(500).json({
        message: "Token expired or invalid",
      })
    }
  } catch (error) {
    return res.status(500).json({
      message: "Token expired or invalid",
    })
  }
}

module.exports = {
  adminLogin,
  checkAdmin,
  registerAdmin,
  changePassword,
  resetPassword
};
