const jwt = require('jsonwebtoken');

// const accessTokenSecret = process.env.JWT_PARTNER_SECRET;
const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET;
const tempTokenSecret = process.env.JWT_TEMP_TOKEN_SECRET;

class TokenService {
    generateAuthTokens(payload, accessTokenSecret) {
        const accessToken = jwt.sign(payload, accessTokenSecret, {
            expiresIn: '10d',
        });
        const refreshToken = jwt.sign(payload, refreshTokenSecret, {
            expiresIn: '1y',
        });
        return { accessToken, refreshToken };
    }

    generatetempToken(payload) {
        const token = jwt.sign(payload, tempTokenSecret, {
            expiresIn: '1h',
        });
        return token;
    }

    // async storeRefreshToken(token, userId) {
    //     try {
    //         await refreshModel.create({
    //             token,
    //             userId,
    //         });
    //     } catch (err) {
    //         console.log(err.message);
    //     }
    // }

    async verifyTempToken(token) {
        return jwt.verify(token, tempTokenSecret);
    }

    async verifyAccessToken(token, secret) {
        return jwt.verify(token, secret);
    }

    async verifyRefreshToken(refreshToken) {
        return jwt.verify(refreshToken, refreshTokenSecret);
    }

    // async findRefreshToken(userId, refreshToken) {
    //     return await refreshModel.findOne({
    //         userId: userId,
    //         token: refreshToken,
    //     });
    // }

    async updateRefreshToken(userId, refreshToken) {
        return await refreshModel.updateOne(
            { userId: userId },
            { token: refreshToken }
        );
    }

    async removeToken(refreshToken) {
        return await refreshModel.deleteOne({ token: refreshToken });
    }
}

module.exports = new TokenService();
