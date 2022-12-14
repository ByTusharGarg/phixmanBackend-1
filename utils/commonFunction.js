var randString = require('rand-token').uid

class common {
    genrateID = (initials = "ORD") => {
        var time = new Date().getTime();
        let id = initials + Math.floor(Math.random() * time).toString().slice(1, 11);
        return id;
    }

    generateRandomString = (initials = "PHIXMAN", size = 16) =>{
        var token = randString(size);
        let id = `${initials}${token}`
        return id
    }

    genrateOTP = () => {
        var time = new Date().getTime();
        let id = Math.floor(Math.random() * time).toString().slice(1, 5);
        return id;
    }    

}

module.exports = new common();