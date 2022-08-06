const encodeImage = (image) => {
  return (
    `data:${image.mimetype};base64,` +
    Buffer.from(image.data).toString("base64")
  );
};

module.exports = {
  encodeImage,
};
