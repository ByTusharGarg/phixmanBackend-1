const moment = require('moment');
const momentTz = require('moment-timezone');
const timeZone = 'Asia/Calcutta';

const now = () => {
    return moment.utc().format();
};

const getLocalTime = () => {
    return momentTz.tz(timeZone).format();
};

const getLocalTimeString = (format = 'DD/MM/YYYY') => {
    return momentTz.tz(timeZone).format(format);
};

const getMomentTime = (time, timeFormat) => {
    return moment(time, timeFormat).utc(true);
};

const getMomentUtcTime = (time) => {
    return moment(time).utc(true);
};

const convertToLocalTime = (time) => {
    return momentTz.tz(time, timeZone).format();
};

const dateUkFormat = (time) => {
    // return moment.tz(time, timeZone).format('DD/MM/YYYY');
    return moment(time).format('DD/MM/YYYY');
};

const specificFormatTime = () => {
    return moment().format('YYYY-MM-DD HH:mm:ss');
};

const getFromNow = (time, bool = false) => {
    return moment(time).tz(timeZone).fromNow(bool);
};

const getDaysDifference = (time) => {
    return moment.tz().diff(moment(time).tz(timeZone), 'days');
};

module.exports = {
    now,
    getLocalTime,
    convertToLocalTime,
    specificFormatTime,
    getFromNow,
    getDaysDifference,
    dateUkFormat,
    getMomentTime,
    getLocalTimeString,
    getMomentUtcTime,
}