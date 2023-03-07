import { DataTypes, Model, Sequelize } from 'sequelize';
import { User } from './user';

class Penalty extends Model {
  static associate() {
    this.belongsTo(User);
  }
}

const penaltyInit = (sequelize: Sequelize) =>
  Penalty.init(
    {
      paper: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: false,
        defaultValue: 0,
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
      modelName: 'Penalty',
      tableName: 'penaltys',
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );

export { penaltyInit, Penalty };
