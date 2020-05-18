'use strict';

const db = use('Database');
const {validate} = use('Validator');

class PositionController {
  constructor() {
    this.table = 'positions'
  }

  async index({request, response}) {
    const {validateIndex, buildSearchQuery, paginate} = require('../../../../helpers');

    if (!(await validateIndex(request))) {
      return response.status(422).send();
    }

    const query = db.query().from(this.table).orderBy('order');

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

    // Create position
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
      item => db.from(this.table).where('id', item.id).update({
        order: item.order
      })
    ));

    return '';
  }
}

module.exports = PositionController;
