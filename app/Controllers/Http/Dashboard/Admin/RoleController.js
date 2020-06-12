'use strict';

const db = use('Database');
const Role = use('App/Models/Role');
const {validate} = use('Validator');

class RoleController {
  async index({request, response}) {
    const {validateIndex, buildSearchQuery, paginate} = require('../../../../helpers');

    if (!(await validateIndex(request))) {
      return response.status(422).send();
    }

    const query = db.query();

    query.from('roles as r')
      .select('r.id', 'r.name', 'r.description')
      .distinct()
      .where('writable', 1);

    await buildSearchQuery(request, ['r.name', 'p.name'], query, query => {
      query.leftJoin('role_permission as rp', 'r.id', 'rp.role_id')
        .leftJoin('permissions as p', 'rp.permission_id', 'p.id');
    });

    const pagination = await paginate(request, query);

    // Load permissions
    const permissions = await db.query()
      .select('p.id', 'display_name as name', 'rp.role_id')
      .from('permissions as p')
      .join('role_permission as rp', 'p.id', 'rp.permission_id')
      .whereIn('rp.role_id', pagination.data.map(role => role.id));

    pagination.data.forEach(role => {
      role.permissions = permissions.filter(permission => permission.role_id === role.id)
        .map(item => ({
          id: item.id,
          name: item.name
        }));
    });

    return pagination;
  }

  async store({request, response}) {
    const data = request.only(['name', 'description', 'permissions']);

    const validation = await validate(data, {
      name: 'required|string|max:190',
      description: 'string|max:2000',
      permissions: 'required|array'
    });

    if (validation.fails()) {
      return response.status(422).send();
    }

    // Create role
    const role = await Role.create(
      request.only(['name', 'description'])
    );

    // Add permissions
    await db.from('role_permission')
      .insert(
        data.permissions.map(permission => ({
          role_id: role.id,
          permission_id: permission
        }))
      );

    // Get permissions

    role.permissions = await db.query()
      .from('permissions')
      .select('id', 'display_name as name')
      .whereIn('id', data.permissions.map(id => id));

    return role;
  }

  async update({request, params, response}) {
    const updateFields = ['name', 'description'];

    const data = request.only([...updateFields, 'permissions']);

    const validation = await validate(data, {
      name: 'string|max:190',
      description: 'string|max:2000',
      permissions: 'array'
    });

    if (validation.fails()) {
      return response.status(422).send();
    }

    if (data.permissions) {
      // Get current permissions
      const permissions = await db.query()
        .select('p.id')
        .from('permissions as p')
        .join('role_permission as rp', 'p.id', 'rp.permission_id')
        .where('rp.role_id', params.id);

      const oldPermIds = permissions.map(role => role.id.toString());

      const shouldBeRemoved = oldPermIds.filter(id => !data.permissions.includes(id));
      const shouldBeAdded = data.permissions.filter(id => !oldPermIds.includes(id));

      if (shouldBeAdded.length || shouldBeRemoved.length) {
        // remove
        await db.query()
          .from('role_permission')
          .whereIn('permission_id', shouldBeRemoved)
          .where('role_id', params.id)
          .delete();

        // Insert
        await db.from('role_permission').insert(shouldBeAdded.map(permission => ({
          role_id: params.id,
          permission_id: permission
        })));
      }
    }

    const {update, loadModerators} = require('../../../../helpers');

    await update(request, updateFields, 'roles', params.id);

    return await loadModerators();
  }

  async destroy({params, response}) {

    if (params.id === 1) {
      // No body can remove Admin role
      return response.status(422).send();
    }

    try {
      await Role.query().where('id', params.id).delete();
    } catch (e) {
      return response.status(422).send('');
    }

    return await require('../../../../helpers').loadModerators();
  }

  async all() {
    return await db.table('roles').select('id', 'name').where('writable', 1);
  }
}

module.exports = RoleController;
