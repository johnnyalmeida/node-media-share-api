import knex from '../config/db';
import HistoryModel from '../models/HistoryModel';
import toUnixEpoch from '../helpers/Datetime';

class HistoryService {
  static async list() {
    const list = await HistoryModel.list();

    list.map(history => ({
      id: history.id,
      name: history.name,
      status: history.status,
      createdAt: toUnixEpoch(history.createdAt),
      updatedAt: toUnixEpoch(history.updatedAt),
      deletedAt: history.deletedAt ? toUnixEpoch(history.deletedAt) : null,
    }));

    return list;
  }

  static async get(data) {
    let history = await HistoryModel.get(data);

    if (history) {
      history = {
        id: history.id,
        name: history.name,
        status: history.status,
        createdAt: toUnixEpoch(history.createdAt),
        updatedAt: toUnixEpoch(history.updatedAt),
        deletedAt: history.deletedAt ? toUnixEpoch(history.deletedAt) : null,
      };
    }

    return history;
  }

  static post(data) {
    return HistoryModel.post(data);
  }

  static put(historyKey, data) {
    return HistoryModel.get(historyKey)
      .then(history => HistoryModel.put(history.id, data));
    // return knex.transaction(async (trx) => {
    //   const history = await HistoryModel.get(historyKey)
    //     .transacting(trx);

    //   if (history) {
    //     await HistoryModel.put(history.id, data)
    //       .transacting(trx);

    //     return true;
    //   }

    //   return false;
    // });
  }

  static delete(storyId, data) {
    return knex.transaction(async (trx) => {
      const history = await HistoryModel.get(storyId)
        .transacting(trx);

      if (history) {
        await HistoryModel.delete(history.id, data)
          .transacting(trx);

        return true;
      }

      return false;
    });
  }
}

export default HistoryService;
