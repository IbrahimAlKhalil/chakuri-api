const redis = require('redis');
const bluebird = require('bluebird');
bluebird.promisifyAll(redis);

module.exports = function () {
    return new Promise(resolve => {
        const client = redis.createClient();

        client.select('khidmat', () => {
            resolve(client);
        });
    });
};
