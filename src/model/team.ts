import { DataTypes, Model, Sequelize } from 'sequelize';
import { Penalty } from './penalty';
import { Pray } from './pray';
import { Service } from './service';
import { Tweet } from './tweet';
import { User } from './user';
export interface TeamsAttributes {
  id: number;
  oauth: string;
  userId: string;
  name: string;
  img: string;
  password: string | null;
  payed: boolean;
  phoneToken: string;
  createdAt?: Date;
  updatedAt?: Date;
  [x: string]: any;
}
class Team extends Model<TeamsAttributes> {
  [x: string]: any;
  static associate() {
    this.hasMany(Tweet);
    this.hasMany(Penalty);
    this.hasMany(Pray);
    this.hasOne(Service);
    this.belongsToMany(User, {
      foreignKey: 'teamId',
      through: 'userteam',
      onDelete: 'cascade',
    });
  }
}

const teamInit = (sequelize: Sequelize) => {
  return Team.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      img: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      bossId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
      },
    },
    {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Team',
      tableName: 'teams',
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );
};

export { teamInit, Team };
