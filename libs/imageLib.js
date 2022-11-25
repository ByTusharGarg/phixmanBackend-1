const encodeImage = (image) => {
  try {
    return (
      `data:${image.mimetype};base64,` +
      Buffer.from(image.data).toString("base64")
    );
  } catch (error) {
    return null;
  }
};

module.exports = {
  encodeImage,
};
