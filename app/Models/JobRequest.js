'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class JobRequest extends Model {
    moderator() {
        return this.belongsTo('App/Models/User', 'id', 'moderator');
    }
}

module.exports = JobRequest;
