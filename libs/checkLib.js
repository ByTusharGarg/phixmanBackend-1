const trim = (x) => {
  if (x && x != null && x != undefined) {
    let value = String(x);
    return value ? value.replace(/^\s+|\s+$/gm, "") : "";
  } else {
    return "";
  }
};

const isEmpty = (value) => {
  if (
    value === null ||
    value === undefined ||
    trim(value) === "" ||
    value.length === 0 ||
    value === "undefined"
  ) {
    return true;
  } else {
    return false;
  }
};

const isEmail = (value) => {
  const expression = /\S+@\S+.\S+/;
  return expression.test(value);
};

const isStrong = (value) => {
  const pswdStrength =
    /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/;
  return pswdStrength.test(value);
};

const isJson = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

module.exports = {
  trim,
  isEmpty,
  isEmail,
  isStrong,
  isJson,
};
