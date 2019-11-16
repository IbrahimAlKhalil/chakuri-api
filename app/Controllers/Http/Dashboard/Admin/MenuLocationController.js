'use strict';
const db = use('Database');

class MenuLocationController {
    async index() {
        return await db.query()
            .select('id', 'name')
            .from('menu_locations');
    }
}

module.exports = MenuLocationController;
