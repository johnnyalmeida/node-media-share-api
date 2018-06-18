import db from '../config/db';
import historyType from '../types/history.json';

const { knex } = db;

class historyModel {
  static list() {
    return knex
      .from('history')
      .whereNot('history.status', historyType.DELETED);
  }

  static get(historyId) {
    return knex
      .first('id, name, status')
      .from('history')
      .where('history.id', historyId)
      .whereNot('history.status', historyType.DELETED);
  }

  static post(data) {
    return knex
      .from('history')
      .insert(data);
  }

  static put(historyId, data) {
    const query = knex
      .from('history');

    if (data.name) {
      query.update('name', data.name);
    }

    query.where('history.id', historyId)
      .whereNot('history.status', historyType.DELETED);

    return query;
  }

  static delete(historyId) {
    return knex
      .from('history')
      .where('history.id', historyId)
      .whereNot('history.status', historyType.DELETED)
      .update({
        status: historyType.DELETED,
        deletedAt: knex.raw('NOW()'),
      });
  }
}

export default historyModel;
