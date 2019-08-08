'use strict'

const db = use('Database')

class ThanaController {
    async index({request}) {
        if (request.input('paginate')) {
            return await db.from('thanas')
                .forPage(
                    request.input('page', 1),
                    request.input('per-page', 10)
                )
        }

        return await db.from('thanas')
    }

    async show({params}) {
        return await db.from('thanas')
            .where('id', params.id)
            .first()
    }

    async byDistrict({params, request}) {
        if (request.input('paginate')) {
            return await db.from('thanas')
                .where('district_id', params.districtId)
                .forPage(
                    request.input('page', 1),
                    request.input('per-page', 10)
                )
        }

        return await db.from('thanas').where('district_id', params.districtId)
    }
}

module.exports = ThanaController
