const { trim } = require('lodash');
const tokenService = require('../services/token-service');

const validateTempToken = async (req, res, next) => {
    try {

        if (!req.headers["authorization"]) {
            return res.status(401).json({ message: 'authorization not found' });
        }

        let token = req.headers["authorization"].split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token not found' });
        }

        const tempData = await tokenService.verifyTempToken(token);

        if (!tempData) {
            res.status(401).json({ message: 'Token mismatch try again' });
        }
        req.tempdata = tempData;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};


module.exports = validateTempToken;