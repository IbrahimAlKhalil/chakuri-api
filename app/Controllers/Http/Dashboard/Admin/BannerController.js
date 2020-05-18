'use strict';

const {validate} = use('Validator');
const File = use('App/Models/File');
const Helpers = use('Helpers');
const db = use('Database');
const Drive = use('Drive');

class BannerController {
  constructor() {
    this.table = 'banners';
  }

  async index({request, response}) {
    const {validateIndex, buildSearchQuery, paginate} = require('../../../../helpers');

    const rules = {
      show: 'in:active,inactive',
      place: 'integer'
    };

    if (!(await validateIndex(request, ['show', 'place'], rules))) {
      return response.status(422).send();
    }

    const query = db.query().from(`${this.table} as b`)
      .select('b.id', 'b.name', 'b.active', 'f.name as picture', 'b.place', 'bp.name as placeName', 'b.link')
      .join('files as f', 'b.picture', 'f.id')
      .join('banner_places as bp', 'b.place', 'bp.id')
      .orderBy('order');

    const show = request.input('show');
    const place = request.input('place');

    if (show) {
      query.where('active', Number(show === 'active'));
    }

    if (place) {
      query.where('bp.id', place);
    }

    await buildSearchQuery(request, ['b.name', 'bp.name', 'b.link'], query);

    return await paginate(request, query);
  }

  async store({request, response}) {
    const data = request.only(['name', 'place', 'link']);
    const picture = await request.file('picture');

    const validation = await validate({...data, picture}, {
      name: 'required|string|max:250',
      picture: 'required|file|file_types:image',
      place: 'required|integer|exists:banner_places,id',
      link: 'string'
    });

    console.log(validation);

    if (validation.fails()) {
      return response.status(422).send();
    }

    const file = await this.savePicture(picture);

    // Create banner
    data.picture = file.id;
    const ids = await db.query()
      .from(this.table)
      .insert(data);

    const place = await db.table('banner_places')
      .select('name')
      .where('id', data.place)
      .first();

    return {
      id: ids[0],
      placeName: place.name,
      ...data,
      picture: file.path,
      active: 1
    };
  }

  async update({request, response, params}) {
    const rules = {
      name: 'string|max:250',
      place: 'integer|exists:banner_places,id',
      link: 'string',
      active: 'in:1,0'
    };

    const data = request.only(Object.keys(rules));
    const validation = await validate(data, rules);

    if (validation.fails()) {
      return response.status(422).send();
    }

    const banner = await db.from('banners').select('id')
      .where('id', params.id)
      .first();

    if (!banner) {
      return response.status(404).send('Banner doesn\'t exists');
    }

    const picture = await request.file('picture');

    if (picture) {
      const pictureValidation = await validate({picture}, {picture: 'file|file_types:image'});

      if (pictureValidation.fails()) {
        return response.status(422).send();
      }

      // Delete old file
      await this.deletePicture(params.id);

      await db.table('banners')
        .update({picture: (await this.savePicture(picture)).id})
        .where('id', params.id);
    }

    const {update} = require('../../../../helpers');

    await update(request, Object.keys(rules), this.table, params.id);
  }

  async destroy({params, response}) {
    try {
      await db.query().from(this.table).where('id', params.id).delete();
      await this.deletePicture(params.id);
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

  async savePicture(picture) {
    const file = new File;
    file.mime_type = picture.headers['content-type'];
    file.file_type_id = 4;
    await file.save();

    const name = `${file.id}.${picture.subtype}`;

    file.name = `banners/${name}`;
    await file.save();

    await picture.move(Helpers.publicPath(`files/banners`), {name, overwrite: true});

    return {id: file.id, path: `banners/${name}`};
  }

  async deletePicture(bannerId) {
    const banner = await db.from('banners as b')
      .join('files as f', 'b.picture', 'f.id')
      .select('picture', 'f.name')
      .where('b.id', bannerId)
      .first();

    // Delete old picture
    try {
      await Promise.all([
        db.table('files')
          .where('id', banner.picture)
          .delete(),
        Drive.delete(`files/${banner.name}`),
      ]);
    } catch (e) {
    }
  }
}

module.exports = BannerController;
