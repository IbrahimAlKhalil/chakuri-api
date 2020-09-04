const redis = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis);

module.exports = function () {
    return new Promise(resolve => {
        const client = redis.createClient({host: process.env.REDIS_HOST, port: process.env.REDIS_PORT});

        client.select('khidmat', () => {
            resolve(client);
        });
    });
};
