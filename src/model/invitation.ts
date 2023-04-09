import { DataTypes, Model, Sequelize } from 'sequelize';
import { Team } from './team';
import { User } from './user';

class Invitation extends Model {
  [x: string]: any;
  static associate() {
    this.belongsTo(User, {
      onDelete: 'cascade',
    });

    this.belongsTo(Team, {
      onDelete: 'cascade',
    });
  }
}

const invitationInit = (sequelize: Sequelize) =>
  Invitation.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Invitation',
      tableName: 'invitations',
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );

export { Invitation, invitationInit };
