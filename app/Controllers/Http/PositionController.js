'use strict'

const db = use('Database')

class PositionController {
    async index() {
        const positions = await db.from('positions')
            .select('id', 'category_id', 'name')

        return positions
    }
}

module.exports = PositionController
