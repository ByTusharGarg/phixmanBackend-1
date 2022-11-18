const { isEmpty, trim, isEmail, isStrong } = require("../libs/checkLib");
const { hashpassword, comparePasswordSync } = require("../libs/passwordLib");
const jwt = require("jsonwebtoken");
const { Admin, Counters } = require("../models");
const { commonMailFunctionToAll } = require("../libs/mailer/mailLib");
const { generateRandomNumChar } = require('../libs/commonFunction');
const { adminTypeArray } = require('../enums/adminTypes');
const emailDatamapping = require('../common/emailcontent');

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
    console.log(error);
    return res.status(500).json({
      message: "Try again later !!!",
    });
  }
};


const createAdmin = async (req, res) => {
  const { name, email, type, zones, category } = req.body;
  if (!adminTypeArray.includes(type)) {
    return res.status(400).json({ message: "invalid admin type" });
  }

  if (!isEmail(email)) {
    return res.status(404).json({
      message: "InValid Email",
    });
  }

  try {
    let counterValue = await Counters.findOneAndUpdate(
      { name: "admins" },
      { $inc: { seq: 1 } },
      { new: true }
    );
    if (!counterValue) {
      counterValue = await Counters.create({ name: "admins" });
    }
    const pass = generateRandomNumChar(8);
    await Admin.create({
      Sno: counterValue.seq,
      Name: name,
      email: email,
      type: type,
      password: hashpassword(pass),
      category: category,
      zones: zones
    });

    // send mail

    emailData = {
      Subject: "[Phixman] Admin informaton E-mail",
      heading1: emailDatamapping['createdAdmin'].heading1,
      heading2: emailDatamapping['createdAdmin'].heading2,
      desc: `Hey ${name}, ` + emailDatamapping['createdAdmin'].desc + `
        email: ${email}
        password: ${pass}
      `,
      buttonName: emailDatamapping['createdAdmin'].buttonName,
      email: email
    };
    // console.log(emailData);
    commonMailFunctionToAll(emailData, "common");

    //send activation mail here
    return res.status(201).json({
      message: "Admin successfull created",
    });
  } catch (error) {
    console.log(error);
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
            { userID: admin._id, type: admin.type },
            process.env.JWT_SECRET_ACCESS_TOKEN,
            {
              expiresIn: "24h", // expires in 24 hours
            }
          );
          return res.status(200).json({
            success: true,
            message: "Authentication successful!",
            token: token,
            role: admin.type,
            user: {
              name: admin.Name,
              email: admin.email,
            },
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
    jwt.verify(token, process.env.JWT_SECRET_ACCESS_TOKEN, (err, decoded) => {
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
    });
  }

  try {
    const resp = await Admin.findOne({ email });
    let token;
    let url;

    if (resp) {
      token = jwt.sign(
        { userID: resp._id, email, type: "admin" },
        process.env.CHNAGE_PASSWORD_SECRET,
        {
          expiresIn: "8hr", // expires in 24 hours
        }
      );
      console.log(process.env.ADMIN_UI_URL);
      url = `${process.env.ADMIN_UI_URL}/resetpassword/${token}`;

      // send email
      const data = {
        url: url,
        Subject: "[Phixman] Password Reset instructions E-mail",
        first_name: resp.Name ? resp.Name : "Dear",
        email: resp.email
      };
      commonMailFunctionToAll(data, "forgotPassword");

      return res.status(200).json({
        success: true,
        message: "Reset password instructions sent on your mail successfully valid till 8hr",
        url
      });
    }
    return res.status(403).json({
      message: "User not Found",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Try again later !!!",
    });
  }
};

const changePassword = async (req, res) => {
  const { token, newpassword } = req.body;

  if (!newpassword || !token) {
    return res.status(400).json({
      message: "token newpassword required",
    });
  }

  try {
    const data = await jwt.verify(token, process.env.CHNAGE_PASSWORD_SECRET);

    if (data) {
      if (data.type === "admin") {
        const resp = await Admin.findOneAndUpdate(
          { email: data.email },
          { password: hashpassword(newpassword) },
          { new: true }
        );

        // send email
        const data = {
          Subject: "[Phixman] Password Reset Success E-mail",
          first_name: resp.Name ? resp.Name : "Dear",
          email: resp.email
        };

        commonMailFunctionToAll(data, "resetSuccess");

        if (resp) {
          return res.status(200).json({
            message: "Password Changed successfully",
          });
        } else {
          return res.status(401).json({
            message: "Token expired or invalid",
          });
        }
      }
    } else {
      return res.status(401).json({
        message: "Token expired or invalid",
      });
    }
  } catch (error) {
    return res.status(401).json({
      message: "Token expired or invalid",
    });
  }
};

const updatePassword = async (req, res) => {
  const { newpassword } = req.body;
  if (!newpassword) {
    return res.status(400).json({
      message: "newpassword required",
    });
  }

  const _id = req.admin._id;

  try {
    const resp = await Admin.findByIdAndUpdate(
      _id,
      { password: hashpassword(newpassword) },
      { new: true }
    );
    return res.status(200).json({ message: "Password Changed successfully" });
  } catch (error) {
    return res.status(401).json({
      message: "Token expired or invalid",
    });
  }
};

const createSubAdmin = async (req, res) => {
  const { name, email, type, zones, category } = req.body;
  if (type !== 'SUBADMIN') {
    return res.status(400).json({ message: "invalid admin type" });
  }

  if (!isEmail(email)) {
    return res.status(404).json({
      message: "InValid Email",
    });
  }

  try {
    let counterValue = await Counters.findOneAndUpdate(
      { name: "SubAdmins" },
      { $inc: { seq: 1 } },
      { new: true }
    );
    if (!counterValue) {
      counterValue = await Counters.create({ name: "SubAdmins" });
    }
    const pass = generateRandomNumChar(8);
    await Admin.create({
      Sno: counterValue.seq,
      Name: name,
      email: email,
      type: type,
      password: hashpassword(pass),
      category: category,
      zones: zones
    });

    // send mail

    emailData = {
      Subject: "[Phixman] Sub-Admin informaton E-mail",
      heading1: emailDatamapping['createdSubAdmin'].heading1,
      heading2: emailDatamapping['createdSubAdmin'].heading2,
      desc: `Hey ${name}, ` + emailDatamapping['createdSubAdmin'].desc + `
        email: ${email}
        password: ${pass}
      You can change randomly generated password whenever you want to`,
      buttonName: emailDatamapping['createdSubAdmin'].buttonName,
      email: email
    };
    // console.log(emailData);
    commonMailFunctionToAll(emailData, "common");

    //send activation mail here
    return res.status(201).json({
      message: "SUB-Admin successfull created",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Try again later !!!",
    });
  }
};




module.exports = {
  adminLogin,
  checkAdmin,
  registerAdmin,
  changePassword,
  resetPassword,
  updatePassword,
  createAdmin,
  createSubAdmin
};
