
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
        modelsArr.push({ Name: phoneName ? `${phoneName} ${data.ROW}` : data.ROW, brandId, categoryId, modelId: data.EDIT });
    })


    for (let index = 1; index < models.length; index++) {
        let currentModel = models[index];

        let singleModelService = {
            modelId: currentModel?.EDIT,
            modelName: `${phoneName} ${currentModel?.ROW}`,
            services: []
        }

        for (keys of servicesCode) {
            if (currentModel[keys] !== "NULL") {
                let data = {}

                if (currentModel[keys] !== "Null") {
                    data['serviceName'] = indexDataObject[keys],
                        data['cost'] = currentModel[keys];
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



module.exports = {
    getParseModels
}