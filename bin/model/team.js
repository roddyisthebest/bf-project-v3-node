"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Team = exports.teamInit = void 0;
const sequelize_1 = require("sequelize");
const penalty_1 = require("./penalty");
const pray_1 = require("./pray");
const service_1 = require("./service");
const tweet_1 = require("./tweet");
const user_1 = require("./user");
class Team extends sequelize_1.Model {
    static associate() {
        this.hasMany(tweet_1.Tweet);
        this.hasMany(penalty_1.Penalty);
        this.hasMany(pray_1.Pray);
        this.hasOne(service_1.Service);
        this.belongsToMany(user_1.User, {
            foreignKey: 'teamId',
            through: 'userteam',
            onDelete: 'cascade',
        });
    }
}
exports.Team = Team;
const teamInit = (sequelize) => {
    return Team.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            onDelete: 'cascade',
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: false,
        },
        introducing: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: false,
        },
        img: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: false,
        },
        bossId: {
            type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            unique: false,
        },
    }, {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: 'Team',
        tableName: 'teams',
        paranoid: true,
        charset: 'utf8',
        collate: 'utf8_general_ci',
    });
};
exports.teamInit = teamInit;
