'use strict';

const db = use('Database');
const {validate} = use('Validator');

class MenuItemController {
  constructor() {
    this.table = 'menu_items';
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

    const query = db.query()
      .from(this.table)
      .orderBy('order');

    const parent = Number(request.input('parent'));

    if (parent) {
      query.where('menu_id', parent);
    }

    await buildSearchQuery(request, ['label', 'type', 'link'], query);

    return await paginate(request, query);
  }

  async store({request, response}) {
    const data = request.only(['label', 'menu_id', 'type', 'link']);

    const validation = await validate(data, {
      label: 'required|string|max:190',
      menu_id: 'required|integer|exists:menus,id',
      type: 'required|in:page,custom',
      link: 'required|string|max:1000'
    });

    if (validation.fails()) {
      return response.status(422).send();
    }

    // Set order
    const items = await db.table('menu_items')
      .count('id as count')
      .where('menu_id', data.menu_id)
      .first();

    data.order = items.count + 1;

    // Create category
    const ids = await db.query()
      .from(this.table)
      .insert(data);

    return {
      id: ids[0],
      ...data
    };
  }

  async update({request, params, response}) {
    const fields = ['label', 'type', 'link'];

    const data = request.only(fields);

    const validation = await validate(data, {
      label: 'string|max:190',
      type: 'string|in:page,custom',
      link: 'string|max:1000'
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

  async reorder({request, response}) {
    const data = request.only(['orders']);

    const validation = await validate(data, {
      orders: 'required|array',
    });

    if (validation.fails()) {
      return response.status(422).send();
    }

    const filtered = data.orders.filter(item => !isNaN(Number(item.order)) && !isNaN(Number(item.id)));

    await Promise.all(filtered.map(
      item => db.from('menu_items').where('id', item.id).update({
        order: item.order
      })
    ));

    return '';
  }
}

module.exports = MenuItemController;
