const PASSWORD_PATTERN = /(?=^.{8,64}$)(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&])(?!.*\s).*$/;

/**************** API STATUS  **********/
const API_FAILED = 'FAILED';

/********** UNAUTHORIZE ERROR   ************/
const UNAUTHORIZE_ERROR = 'UNAUTHORIZE_ERROR';
const UNAUTHORIZE_ERROR_CODE = 401;

/***************  VALIDATION ERROR ***************/
const VALIDATION_ERROR = 'VALIDATION_ERROR';
const VALIDATION_ERROR_CODE = 400;

/************** SERVER ERROR  ************/
const SERVER_ERROR = 'SERVER_ERROR';
const SERVER_ERROR_CODE = 500;

/********** SUCCESS TYPES  ***********/
const SUCCESS = 'SUCCESS';
const SUCCESS_CODE = 200;

const CREATED_SUCCESS = 'CREATED';
const CREATED_SUCCESS_CODE = 201;

/********** NOTFOUNT ERROR   ************/
const NOTFOUND_ERROR = 'NOTFOUND_ERROR';
const NOTFOUND_ERROR_CODE = 404;


function handelSuccess(res, data) {
    // todo logger need to be added 
    return res.status(SUCCESS_CODE).json({ statusCode: SUCCESS_CODE, requestStatus: true, status: SUCCESS, result: data });
}

function handelSuccessOther(res, data, code) {
    // todo logger need to be added
    return res.status(SUCCESS_CODE).json({ statusCode: code || 201, requestStatus: true, status: CREATED_SUCCESS, result: data });
}

function handelUnauthorize(res, message) {
    return res.status(SUCCESS_CODE).json({ status: API_FAILED, requestStatus: false, statusCode: UNAUTHORIZE_ERROR_CODE, error: { type: UNAUTHORIZE_ERROR, message: message } });
}

function handelValidationError(res, error) {
    return res.status(SUCCESS_CODE).json({ status: API_FAILED, requestStatus: false, statusCode: VALIDATION_ERROR_CODE, error: { type: VALIDATION_ERROR, message }, ...data });
}

function handelServerError(res, error) {
    return res.status(SUCCESS_CODE).json({ status: API_FAILED, requestStatus: false, statusCode: SERVER_ERROR_CODE, error: { type: SERVER_ERROR, message: error.message || 'Something went wrong !' } });
}


function handelNoteFoundError(res, error, message) {
    return res.status(SUCCESS_CODE).json({ status: NOTFOUND_ERROR, requestStatus: false, statusCode: NOTFOUND_ERROR_CODE, error: { type: NOTFOUND_ERROR, message: message || 'Something went wrong !' } });
}


module.exports = {
    handelSuccess, handelSuccessOther, handelServerError,
    handelUnauthorize,
    handelValidationError,
    handelGatewayOut,
    handelNoteFoundError
};