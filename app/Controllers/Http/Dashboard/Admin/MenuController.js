'use strict';

const db = use('Database');
const {validate} = use('Validator');

class MenuController {
    constructor() {
        this.table = 'menus';
    }

    async show({params, response}) {
        const page = await db.table(this.table)
            .select('id', 'name')
            .where('id', params.id)
            .first();

        if (!page) {
            return response.status(404).send('');
        }

        return page;
    }

    async index({request, response}) {
        const {validateIndex, buildSearchQuery, paginate} = require('../../../../helpers');

        if (!(await validateIndex(request))) {
            return response.status(422).send();
        }

        const query = db.query().from(`${this.table} as m`)
            .select('m.id', 'm.name', 'l.name as location', 'm.menu_location_id', 'm.enabled')
            .join('menu_locations as l', 'm.menu_location_id', 'l.id');

        await buildSearchQuery(request, ['m.name', 'l.name'], query);

        return await paginate(request, query);
    }

    async store({request, response}) {
        const data = request.only(['name', 'menu_location_id']);

        const validation = await validate(data, {
            name: 'required|string|max:190',
            menu_location_id: 'required|integer|exists:menu_locations,id'
        });

        if (validation.fails()) {
            return response.status(422).send();
        }

        // Create post
        const ids = await db.query()
            .from(this.table)
            .insert(data);

        // load menu location
        const location = await db.table('menu_locations')
            .select('name')
            .where('id', data.menu_location_id)
            .first();

        return {
            id: ids[0],
            enabled: 1,
            ...data,
            location: location.name
        };
    }

    async update({request, params, response}) {
        const fields = ['name', 'menu_location_id', 'enabled'];

        const data = request.only(fields);

        const validation = await validate(data, {
            name: 'string|max:190',
            menu_location_id: 'integer|exists:menu_locations,id',
            enabled: 'in:1,0'
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

module.exports = MenuController;
