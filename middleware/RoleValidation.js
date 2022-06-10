export const validateAdminRole = (req, res, next) => {
    try {
        let token = trim(req.headers["authorization"]);
        if (!isEmpty(token)) {
            if (token.startsWith("Bearer ")) {
                token = token.slice(7, token.length);
            }
        }
        jwt.verify(token, process.env.Secret, (err, decoded) => {
            req.decoded = decoded;
            if (decoded.type === 'admin') {
                next();
            }
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Not allowed to access",
        });
    }
}


export const validateCustomerRole = (req, res, next) => {
    try {
        let token = trim(req.headers["authorization"]);
        if (!isEmpty(token)) {
            if (token.startsWith("Bearer ")) {
                token = token.slice(7, token.length);
            }
        }
        jwt.verify(token, process.env.Secret, (err, decoded) => {
            req.decoded = decoded;
            if (decoded.type === 'customer') {
                next();
            }
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Not allowed to access",
        });
    }
}

export const validatePartnerRole = (req, res, next) => {
    try {
        let token = trim(req.headers["authorization"]);
        if (!isEmpty(token)) {
            if (token.startsWith("Bearer ")) {
                token = token.slice(7, token.length);
            }
        }
        jwt.verify(token, process.env.Secret, (err, decoded) => {
            req.decoded = decoded;
            if (decoded.type === 'partner') {
                next();
            }
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Not allowed to access",
        });
    }
}





