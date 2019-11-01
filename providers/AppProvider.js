'use strict';

const {ServiceProvider} = require('@adonisjs/fold');

class AppProvider extends ServiceProvider {
    /**
     * Register namespaces to the IoC container
     *
     * @method register
     *
     * @return {void}
     */
    register() {

    }

    /**
     * Attach context getter when all providers have
     * been registered
     *
     * @method boot
     *
     * @return {void}
     */
    boot() {
        const Validator = use('Validator');
        const Database = use('Database');

        Validator.extend('exists', async (data, field, message, args, get) => {
            const value = get(data, field);
            if (!value) {
                /**
                 * skip validation if value is not defined. `required` rule
                 * should take care of it.
                 */
                return;
            }

            const [table, column] = args;
            const row = await Database.table(table).where(column, value).count('* as total');

            if (!row[0].total) {
                throw message;
            }
        });

        Validator.extend('uniqueUserMobile', async (data, field, message, args, get) => {
            const value = get(data, field);
            if (!value) {
                /**
                 * skip validation if value is not defined. `required` rule
                 * should take care of it.
                 */
                return;
            }

            const [type] = args;
            const row = await Database.table('users').where('mobile', value).where('user_type_id', type).count('* as total');

            if (row[0].total) {
                throw message;
            }
        });

        Validator.extend('arrayOfInt', async (data, field, message, args, get) => {
            const value = get(data, field);
            if (!value) {
                /**
                 * skip validation if value is not defined. `required` rule
                 * should take care of it.
                 */
                return;
            }

            if (!Array.isArray(value)) {
                throw message;
            }

            const notValid = value.some(item => typeof Number(item) !== 'number');

            if (notValid) {
                throw message;
            }
        });

        Validator.extend('mobile', async (data, field, message, args, get) => {
            const value = get(data, field);
            if (!value) {
                /**
                 * skip validation if value is not defined. `required` rule
                 * should take care of it.
                 */
                return;
            }

            const test = /^\+880/.test(value);

            if (test && value.length !== 14) {
                throw message;
            } else if (!test && value.length !== 11) {
                throw message;
            }
        });
    }
}

module.exports = AppProvider;
