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
    return res.status(SUCCESS_CODE).json({ statusCode: SUCCESS_CODE, requestStatus: true, status: SUCCESS, ...data });
}

function handelSuccessOther(res, data, code) {
    // todo logger need to be added
    return res.status(SUCCESS_CODE).json({ statusCode: code || 201, requestStatus: true, status: CREATED_SUCCESS, ...data });
}

// Error handlers
function handelUnauthorize(res, error = {}) {
    return res.status(SUCCESS_CODE).json({ status: API_FAILED, requestStatus: false, statusCode: UNAUTHORIZE_ERROR_CODE, type: UNAUTHORIZE_ERROR, ...error });
}

function handelValidationError(res, error = {}) {
    return res.status(SUCCESS_CODE).json({ status: API_FAILED, requestStatus: false, statusCode: VALIDATION_ERROR_CODE, type: VALIDATION_ERROR, ...error });
}

function handelServerError(res, error = {}) {
    return res.status(SUCCESS_CODE).json({ status: API_FAILED, requestStatus: false, statusCode: SERVER_ERROR_CODE, type: SERVER_ERROR, ...error });
}

function handelNoteFoundError(res, error = {}) {
    return res.status(SUCCESS_CODE).json({ status: API_FAILED, requestStatus: false, statusCode: NOTFOUND_ERROR_CODE, type: NOTFOUND_ERROR, ...error });
}

module.exports = {
    handelSuccess, handelSuccessOther, handelServerError,
    handelUnauthorize,
    handelValidationError,
    handelNoteFoundError
};