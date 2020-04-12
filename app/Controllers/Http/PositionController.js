'use strict';

const db = use('Database');

class PositionController {
  async index({params}) {
    return db.query()
      .from('positions').select('id', 'name').orderBy('order');
  }
}

module.exports = PositionController;
