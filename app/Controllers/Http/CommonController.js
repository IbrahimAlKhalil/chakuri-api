'use strict';

const db = use('Database');

class CommonController {
  time() {
    return Date.now();
  }

  async institutionCount() {
    const counts = await Promise.all([
      db.from('institutions').count('id as count'),
      db.from('jobs').where('approved', 0).count('id as count')
    ]);


    return {institute: counts[0][0].count, job: counts[1][0].count};
  }

  async favoriteAndApplied({params, auth}) {
    const {jobId} = params;
    const {id} = auth;

    const tables = ['favorites', 'applications'];

    const rows = await Promise.all(
      tables.map(table => db.select('id')
        .from(table)
        .where('job_id', jobId)
        .where('user_id', id)
        .first()
      )
    );

    return {
      favorite: !!rows[0],
      applied: !!rows[1]
    };
  }

  async setting({response, params}) {
    const setting = await db.query()
      .select('value')
      .from('settings')
      .where('name', params.name)
      .first();

    if (setting) {
      return setting.value;
    }

    return response.status(404).send('');
  }

  async menu() {
    // Get menu ids

    const menu = await db.query()
      .select('m.id', 'ml.name', 'm.name as menuName')
      .from('menus as m')
      .where('m.enabled', 1)
      .join('menu_locations as ml', 'm.menu_location_id', 'ml.id')
      .groupBy('ml.id');


    // Get menu items
    const menuItems = Array.from(await db.query()
      .select('type', 'label', 'link', 'menu_id')
      .from('menu_items')
      .whereIn('menu_id', menu.map(m => m.id))
      .orderBy('order'));

    menu.forEach(mn => {

      mn.items = [];

      menuItems.forEach(item => {
        if (item.menu_id !== mn.id) {
          return;
        }

        delete item.menu_id;
        mn.items.push(item);
      });
    });


    const menuObject = {};

    menu.forEach(mn => {
      menuObject[mn.name] = mn;
      delete mn.id;
    });

    return menuObject;
  }

  async page({params, response}) {
    const page = await db.query()
      .from('posts')
      .where('id', params.id)
      .first();

    if (!page) {
      return response.status(404).send('');
    }

    return page;
  }

  async categories() {
    return await db.query()
      .select('id', 'name', 'icon')
      .from('categories');
  }

  async banners() {
    return await db
      .from('banners as b')
      .select('b.id', 'b.name', 'b.link', 'bp.slug as place', 'f.name as image')
      .join('files as f', 'b.picture', 'f.id')
      .join('banner_places as bp', 'b.place', 'bp.id')
      .where('b.active', 1)
      .orderBy('b.order');
  }
}

module.exports = CommonController;
