const getParseModels = (models, brandId, categoryId, phoneName) => {
    let modelsArr = [];
    models.map(function (data) {
        console.log(data.ROW);
        modelsArr.push({ Name: phoneName ? `${phoneName} ${data.ROW}` : data.ROW, brandId, categoryId, modelId: data.EDIT });
    })
    return { modelsArr }
}



module.exports = {
    getParseModels
}