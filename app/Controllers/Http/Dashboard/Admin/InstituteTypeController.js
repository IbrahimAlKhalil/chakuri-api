'use strict';

const db = use('Database');
const {validate} = use('Validator');

class InstituteTypeController {
    constructor() {
        this.table = 'institution_types';
    }

    async index({request, response}) {
        const {validateIndex, buildSearchQuery, paginate} = require('../../../../helpers');

        if (!(await validateIndex(request))) {
            return response.status(422).send();
        }

        const query = db.query().from(this.table);

        await buildSearchQuery(request, ['name'], query);

        return await paginate(request, query);
    }

    async store({request, response}) {
        const data = request.only(['name']);

        const validation = await validate(data, {
            name: 'required|string|max:190'
        });

        if (validation.fails()) {
            return response.status(422).send();
        }

        // Create institute-type
        const ids = await db.query()
            .from(this.table)
            .insert(data);

        return {
            id: ids[0],
            name: data.name
        };
    }

    async update({request, params, response}) {
        const fields = ['name'];

        const data = request.only(fields);

        const validation = await validate(data, {
            name: 'string|max:190'
        });

        if (validation.fails()) {
            return response.status(422).send();
        }

        const {update} = require('../../../../helpers');

        await update(request, fields, this.table, params.id);
    }

    async destroy({params, response}) {
        try {
            await db.query().from(this.table).where('id', params.id).delete();
        } catch (e) {
            return response.status(422).send('');
        }
    }
}

module.exports = InstituteTypeController;
