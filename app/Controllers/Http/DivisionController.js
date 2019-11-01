'use strict'

const db = use('Database')

class DivisionController {
    async index() {
        return await db.from('divisions')
    }
}

module.exports = DivisionController
