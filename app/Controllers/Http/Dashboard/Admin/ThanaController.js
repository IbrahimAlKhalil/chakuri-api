'use strict';

const db = use('Database');
const {validate} = use('Validator');

class ThanaController {
    constructor() {
        this.table = 'thanas';
    }

    async index({request, response}) {
        const {validateIndex, buildSearchQuery, paginate} = require('../../../../helpers');

        const fields = ['parent'];
        const rules = {
            parent: 'integer'
        };

        if (!(await validateIndex(request, fields, rules))) {
            return response.status(422).send();
        }

        const query = db.query().from(this.table);

        const parent = Number(request.input('parent'));

        if (parent) {
            query.where('district_id', parent);
        }

        await buildSearchQuery(request, ['name'], query);

        return await paginate(request, query);
    }

    async store({request, response}) {
        const data = request.only(['name', 'district_id']);

        const validation = await validate(data, {
            name: 'required|string|max:190',
            district_id: 'required|integer|exists:districts,id'
        });

        if (validation.fails()) {
            return response.status(422).send();
        }

        // Create category
        const ids = await db.query()
            .from(this.table)
            .insert(data);

        return {
            id: ids[0],
            name: data.name,
            district_id: data.district_id
        };
    }

    async update({request, params, response}) {
        const fields = ['name', 'district_id'];

        const data = request.only(fields);

        const validation = await validate(data, {
            name: 'string|max:190',
            district_id: 'integer|exists:districts,id'
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

module.exports = ThanaController;
