import { DataTypes, Model, Sequelize } from 'sequelize';
import { Penalty } from './penalty';
import { Pray } from './pray';
import { Service } from './service';
import { Team } from './team';
import { Tweet } from './tweet';

export interface UsersAttributes {
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
class User extends Model<UsersAttributes> {
  [x: string]: any;
  static associate() {
    this.hasMany(Tweet);
    this.hasMany(Penalty);
    this.hasMany(Pray);
    this.hasOne(Service);
    this.belongsToMany(Team, {
      foreignKey: 'userId',
      through: 'userteam',
      onDelete: 'cascade',
    });
  }
}

const userInit = (sequelize: Sequelize) => {
  return User.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: false,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
      },
      oauth: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
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
      password: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
      },
      payed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        unique: false,
        defaultValue: false,
      },
      phoneToken: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
      },
    },
    {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'User',
      tableName: 'users',
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );
};

export { userInit, User };
