const Server = use('Server');
module.exports = io = use('socket.io')(Server.getInstance());

const redisAdapter = require('socket.io-redis');
const AuthManager = require('../app/AuthManager');

io.adapter(redisAdapter({host: process.env.REDIS_HOST, port: process.env.REDIS_PORT}));

io.use(async (socket, next) => {
    const error = new Error('Authentication failed');

    // Authenticate

    const {token} = socket.handshake.query;

    // Token can't be null
    if (!token) {

        return next(error);
    }


    const auth = await AuthManager.authSocket(token);

    if (!auth) {
        // User is not authenticated

        return next(error);
    }

    // Join user's room
    socket.join('u-' + auth.userId);

    return next();
});
