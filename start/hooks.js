const {hooks} = require('@adonisjs/ignitor');

hooks.after.providersBooted(async () => {
    global.redisClient = await require('./redis')();
    const {loadModerators, loadSettings} = require('../app/helpers');

    global.getSetting = async function (name) {
        return await redisClient.getAsync(`setting-${name}`);
    };

    global.updateSetting = async function (name, value) {
        return await redisClient.setAsync(`setting-${name}`, value);
    };

    await loadModerators();
    await loadSettings();
});
