'use strict';

const db = use('Database');
const User = use('App/Models/User');

class UserController {
    constructor() {
        this.table = 'users';
    }

    async index({request, response}) {

        const {validateIndex, buildSearchQuery, paginate} = require('../../../../helpers');

        const rules = {
            show: 'in:enabled,disabled',
            type: 'in:all,1,2'
        };

        if (!(await validateIndex(request, ['show', 'type'], rules))) {
            return response.status(422).send();
        }


        const query = db.query();

        query.from('users as u')
            .distinct()
            .select('u.id', 'f.name as photo', 'mobile', 'u.name', 'disabled', 'user_type_id as type')
            .leftJoin('files as f', 'u.photo', 'f.id')
            .where('user_type_id', '!=', 3);

        const show = request.input('show');

        if (show) {
            query.where('disabled', show === 'disabled' ? 1 : 0);
        }

        const type = Number(request.input('type'));

        switch (type) {
            case 1:
                query.where('user_type_id', type);
                break;
            case 2:
                query.where('user_type_id', type);
        }

        const keyword = request.input('keyword');

        if (keyword && !isNaN(Number(keyword)) && /\d{1,}/.test(keyword) && keyword.indexOf(0) !== 0) {
            query.where('u.id', keyword);
        } else {
            await buildSearchQuery(request, ['u.name', 'email', 'mobile'], query);
        }

        return await paginate(request, query);
    }

    async destroy({params, response}) {

        // Check existence
        const user = await User.query()
            .select('id', 'disabled')
            .where('user_type_id', '!=', 3)
            .where('id', params.id)
            .first();

        if (!user) {
            // User doesn't exist
            return response.status(422).send();
        }

        await User.query()
            .update({
                disabled: !user.disabled
            })
            .where('id', user.id);

        return '';
    }
}

module.exports = UserController;
