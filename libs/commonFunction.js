const fs = require('fs');
const randomstring = require("randomstring");


const getParseModels = (models, brandId, categoryId, phoneName) => {
    let modelsArr = [];
    let servicesCode = [];
    let indexDataObject = models[0];
    let services = [];

    for (keys in indexDataObject) {
        if (keys !== "DO NOT" && keys !== "EDIT" && keys !== "THIS" && keys !== "ROW") {
            servicesCode.push(keys);
        }
    }

    let modelsData = models.slice(1);

    modelsData.map(function (data) {
        modelsArr.push({ Name: `${data.ROW.toLowerCase().includes(phoneName.toLowerCase()) ? data.ROW : phoneName + " " + data.ROW}`, brandId, categoryId, modelId: data.EDIT });
    })


    // services
    for (let index = 1; index < models.length; index++) {
        let currentModel = models[index];

        let singleModelService = {
            categoryId,
            modelId: currentModel?.EDIT,
            modelName: `${currentModel?.ROW.toLowerCase().includes(phoneName.toLowerCase()) ? currentModel?.ROW : phoneName + " " + currentModel?.ROW}`,
            services: []
        }

        for (keys of servicesCode) {
            if (currentModel[keys] !== "NULL") {
                let data = {}

                if (currentModel[keys] !== "Null") {
                    data['serviceName'] = indexDataObject[keys],
                        data['cost'] = currentModel[keys];
                    data['serviceId'] = keys;
                }

                if (Object.keys(data).length > 0) {
                    singleModelService?.services.push(data);
                }
            }
        }

        services.push(singleModelService);
    }

    return { modelsArr, services }
}

function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file).toString('base64');
    return bitmap;
}


const generateRandomReferralCode = () => {
    return randomstring.generate({
        length: 12,
        charset: 'alphanumeric'
    });
}

const generateRandomNumChar = (len = 8) => {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@abcdefghijklmnopqrstuvwxyz";
    var string_length = len;
    var randomstring = '';
    for (var i = 0; i < string_length - 2; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
    }
    randomstring += "@1";
    return randomstring;
}

module.exports = {
    getParseModels,
    base64_encode,
    generateRandomReferralCode,
    generateRandomNumChar
}