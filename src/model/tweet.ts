import { DataTypes, Model, Sequelize } from 'sequelize';
import { User } from './user';

class Tweet extends Model {
  static associate() {
    this.belongsTo(User);
  }
}

const tweetInit = (sequelize: Sequelize) =>
  Tweet.init(
    {
      content: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
      },
      img: {
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
      modelName: 'Tweet',
      tableName: 'tweets',
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );

export { tweetInit, Tweet };
