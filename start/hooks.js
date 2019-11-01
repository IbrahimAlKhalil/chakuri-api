const {hooks} = require('@adonisjs/ignitor');

hooks.after.providersBooted(async () => {
    const {loadModerators, moderators} = require('../app/helpers');

    await loadModerators();
});
