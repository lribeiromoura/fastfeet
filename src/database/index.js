import Sequelize from 'sequelize';

import User from '../app/models/User';
import Recipients from '../app/models/Recipients';
import File from '../app/models/File';
import Deliveryman from '../app/models/Deliveryman';
import Order from '../app/models/Order';
import Deliveryproblem from '../app/models/Deliveryproblem';

import DatabaseConfig from '../config/database';

const models = [User, Recipients, File, Deliveryman, Order, Deliveryproblem];

class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(DatabaseConfig);
    models
      .map((model) => model.init(this.connection))
      .map(
        (model) => model.associate && model.associate(this.connection.models)
      );
  }
}

export default new Database();
