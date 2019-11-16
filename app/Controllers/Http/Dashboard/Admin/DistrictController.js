'use strict';

const db = use('Database');
const {validate} = use('Validator');

class DistrictController {
    constructor() {
        this.table = 'districts';
    }

    async show({params, response}) {
        const item = await db.query()
            .select('id', 'name')
            .from(this.table)
            .where('id', params.id)
            .first();

        if (!item) {
            return response.status(404).send('');
        }

        return item;
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
            query.where('division_id', parent);
        }

        await buildSearchQuery(request, ['name'], query);

        return await paginate(request, query);
    }

    async store({request, response}) {
        const data = request.only(['name', 'division_id']);

        const validation = await validate(data, {
            name: 'required|string|max:190',
            division_id: 'required|integer|exists:divisions,id'
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
            division_id: data.division_id
        };
    }

    async update({request, params, response}) {
        const fields = ['name', 'division_id'];

        const data = request.only(fields);

        const validation = await validate(data, {
            name: 'string|max:190',
            division_id: 'integer|exists:divisions,id'
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

    async all() {
        return await db.table(this.table).select('id', 'name');
    }
}

module.exports = DistrictController;
