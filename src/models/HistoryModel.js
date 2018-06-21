import db from '../config/db';
import historyType from '../types/history.json';

const { knex } = db;

class historyModel {
  static list() {
    return knex
      .select('key', 'type')
      .from('history')
      .where('history.status', historyType.SUCCESS);
  }

  static get(historyKey) {
    return knex
      .first('id')
      .from('history')
      .where('history.key', historyKey)
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

    if (data.status) {
      query.update('status', data.status);
    }

    query.where('history.id', historyId);
    // .whereNot('history.status', historyType.DELETED);

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
