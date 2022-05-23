module.exports = {
  model: "ProductType",
  documents: {
    mobile: {
      name: "Mobile",
      key: "mobile",
      icon: `${process.env.backendUrl}product/icon/mobile.svg`,
      video: "",
      servedAt: "store",
    },
    laptop: {
      name: "Laptop",
      key: "laptop",
      icon: `${process.env.backendUrl}product/icon/laptop.svg`,
      video: "",
      servedAt: "store",
    },
    printer: {
      name: "Printer",
      key: "printer",
      icon: `${process.env.backendUrl}product/icon/printer.svg`,
      video: "",
      servedAt: "store",
    },
    ac: {
      name: "Air Conditioner",
      key: "ac",
      icon: `${process.env.backendUrl}product/icon/ac.svg`,
      video: "",
      servedAt: "home",
    },
    chim: {
      name: "Chimney",
      key: "chimney",
      icon: `${process.env.backendUrl}product/icon/chimney.svg`,
      video: "",
      servedAt: "home",
    },
    gys: {
      name: "Gyser",
      key: "gyser",
      icon: `${process.env.backendUrl}product/icon/gyser.svg`,
      video: "",
      servedAt: "home",
    },
    micro: {
      name: "Microwave",
      key: "microwave",
      icon: `${process.env.backendUrl}product/icon/microwave.svg`,
      video: "",
      servedAt: "home",
    },
  },
};
