"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tweet = exports.tweetInit = void 0;
const sequelize_1 = require("sequelize");
const user_1 = require("./user");
class Tweet extends sequelize_1.Model {
    static associate() {
        this.belongsTo(user_1.User);
    }
}
exports.Tweet = Tweet;
const tweetInit = (sequelize) => Tweet.init({
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        unique: false,
    },
    img: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        unique: false,
    },
    weekend: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Tweet',
    tableName: 'tweets',
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});
exports.tweetInit = tweetInit;
