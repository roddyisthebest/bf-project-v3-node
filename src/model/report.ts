import { DataTypes, Model, Sequelize } from 'sequelize';
import { User } from './user';

class Report extends Model {
  static associate() {
    this.belongsTo(User);
  }
}

const reportInit = (sequelize: Sequelize) =>
  Report.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        onDelete: 'cascade',
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: false,
      },
      model: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: false,
      },
      //   '{model:tweet,id:5}'
    },
    {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Report',
      tableName: 'reports',
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );

export { reportInit, Report };
