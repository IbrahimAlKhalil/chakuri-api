'use strict';

const db = use('Database');
const {validate} = use('Validator');

class PageController {
    constructor() {
        this.table = 'posts';
    }

    async index({request, response}) {
        const {validateIndex, buildSearchQuery, paginate} = require('../../../../helpers');

        if (!(await validateIndex(request))) {
            return response.status(422).send();
        }

        const query = db.query().from(`${this.table} as p`)
            .select('p.id', 'p.title', 'u.name as author')
            .join('users as u', 'p.user_id', 'u.id');

        await buildSearchQuery(request, ['title', 'u.name'], query);

        return await paginate(request, query);
    }

    async show({params, response}) {
        const page = await db.table('posts')
            .select('title', 'content')
            .where('id', params.id)
            .first();

        if (!page) {
            return response.status(404).send('');
        }

        return page;
    }

    async store({request, response, auth}) {
        const data = request.only(['title', 'content']);

        const validation = await validate(data, {
            title: 'required|string|max:1000',
            content: 'required|string',
        });

        if (validation.fails()) {
            return response.status(422).send();
        }

        data.user_id = auth.id;

        // Create post
        const ids = await db.query()
            .from(this.table)
            .insert(data);

        return {
            id: ids[0]
        };
    }

    async update({request, params, response}) {
        const fields = ['title', 'content'];

        const data = request.only(fields);

        const validation = await validate(data, {
            title: 'required|string|max:1000',
            content: 'required|string',
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

module.exports = PageController;
