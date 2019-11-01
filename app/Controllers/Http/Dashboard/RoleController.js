'use strict';

const db = use('Database');
const {validate} = use('Validator');

class RoleController {
    async index({request, response}) {
        if (request.get('all')) {
            return await db.table('roles');
        }

        const validation = await validate(request.only(['perPage', 'page', 'take']), {
            perPage: 'integer|max:30',
            page: 'integer|min:1',
            take: 'integer|max:30'
        });

        if (validation.fails()) {
            return response.status(422).send();
        }

        const page = Number(request.input('page', 1));
        const perPage = Number(request.input('perPage', 6));

        const pagination = await db.table('roles')
            .paginate(page || 1, perPage);

        const take = request.input('take', perPage);

        pagination.data = pagination.data.slice(pagination.data.length - take, pagination.data.length);

        return pagination;
    }

    async count() {
        return await db.table('roles')
            .count('id as count');
    }

    async store() {

    }
}

module.exports = RoleController;
