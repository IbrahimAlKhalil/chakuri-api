'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash');

class User extends Model {
    setMobile(mobile) {
        const {truncateMobile} = require('../helpers');

        return truncateMobile(mobile);
    }

    tokens() {
        return this.hasMany('App/Models/Token');
    }
/*
    roles() {
        return this.belongsToMany('App/Models/Role');
    }*/

    static boot() {
        super.boot();

        /**
         * A hook to hash the user password before saving
         * it to the database.
         */
        this.addHook('beforeSave', async (userInstance) => {
            if (userInstance.dirty.password) {
                userInstance.password = await Hash.make(userInstance.password);
            }
        });
    }
}

module.exports = User;
