"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.userInit = void 0;
const sequelize_1 = require("sequelize");
const penalty_1 = require("./penalty");
const pray_1 = require("./pray");
const service_1 = require("./service");
const team_1 = require("./team");
const tweet_1 = require("./tweet");
class User extends sequelize_1.Model {
    static associate() {
        this.hasMany(tweet_1.Tweet);
        this.hasMany(penalty_1.Penalty);
        this.hasMany(pray_1.Pray);
        this.hasOne(service_1.Service);
        this.belongsToMany(team_1.Team, {
            foreignKey: 'userId',
            through: 'userteam',
            onDelete: 'cascade',
        });
    }
}
exports.User = User;
const userInit = (sequelize) => {
    return User.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            onDelete: 'cascade',
        },
        uid: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        oauth: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: false,
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: false,
        },
        img: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: false,
        },
        password: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            unique: false,
        },
        phoneToken: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            unique: false,
        },
        admin: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            unique: false,
            defaultValue: false,
        },
    }, {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: 'User',
        tableName: 'users',
        paranoid: true,
        charset: 'utf8',
        collate: 'utf8_general_ci',
    });
};
exports.userInit = userInit;
