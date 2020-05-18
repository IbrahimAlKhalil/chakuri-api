'use strict';
const db = use('Database');

class BannerPlaceController {
  async index() {
    return await db.query()
      .select('id', 'name')
      .from('banner_places');
  }
}

module.exports = BannerPlaceController;
