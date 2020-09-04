const redis = require('redis');
const bluebird = require('bluebird');
const Env = use('Env');

bluebird.promisifyAll(redis);

module.exports = function () {
    return new Promise(resolve => {
        const client = redis.createClient({host: Env.get('REDIS_HOST'), port: ENV.get('REDIS_PORT')});

        client.select('khidmat', () => {
            resolve(client);
        });
    });
};
