import { DataTypes, Model, Sequelize } from 'sequelize';
import { User } from './user';

class Pray extends Model {
  static associate() {
    this.belongsTo(User);
  }
}

const prayInit = (sequelize: Sequelize) =>
  Pray.init(
    {
      content: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      weekend: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
    },
    {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Pray',
      tableName: 'prays',
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );

export { prayInit, Pray };
