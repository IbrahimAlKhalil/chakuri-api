'use strict';

const db = use('Database');

class PositionController {
    async index() {
        return await db.from('positions')
            .select('id', 'name');
    }
}

module.exports = PositionController;
