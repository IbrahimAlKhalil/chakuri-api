'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');
const io = require('../../start/socket');

class Notification extends Model {
    static boot() {
        super.boot();

        this.addHook('afterCreate', async notification => {
            io.to('u-' + notification.user_id).emit('n', notification);
        });
    }
}

module.exports = Notification;
