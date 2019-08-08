'use strict'
const db = use('Database')

class DistrictController {
    async index({request}) {
        if (request.input('paginate')) {
            return await db.from('districts')
                .forPage(
                    request.input('page', 1),
                    request.input('per-page', 10)
                )
        }

        return await db.from('districts')
    }

    async show({params}) {
        return await db.from('districts')
            .where('id', params.id)
            .first()
    }

    async byDivision({params, request}) {
        if (request.input('paginate')) {
            return await db.from('districts')
                .where('division_id', params.divisionId)
                .forPage(
                    request.input('page', 1),
                    request.input('per-page', 10)
                )
        }

        return await db.from('districts').where('division_id', params.divisionId);
    }
}

module.exports = DistrictController
