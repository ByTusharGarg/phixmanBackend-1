class common {
    genrateID = (initials = "ORD") => {
        var time = new Date().getTime();
        let id = initials + Math.floor(Math.random() * time).toString().slice(1, 11);
        return id;
    }

}


module.exports = new common();