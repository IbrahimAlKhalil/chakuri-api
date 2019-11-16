'use strict';

const db = use('Database');

class PermissionController {
    async index() {
        return await db.table('permissions').select('id', 'display_name as name');
    }
}

module.exports = PermissionController;
