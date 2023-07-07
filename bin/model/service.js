"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceInit = exports.Service = void 0;
const sequelize_1 = require("sequelize");
const user_1 = require("./user");
class Service extends sequelize_1.Model {
    static associate() {
        this.belongsTo(user_1.User, {
            onDelete: 'cascade',
        });
    }
}
exports.Service = Service;
const serviceInit = (sequelize) => Service.init({
    tweet: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        unique: false,
        defaultValue: true,
    },
    pray: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        unique: false,
        defaultValue: true,
    },
    penalty: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        unique: false,
        defaultValue: true,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Service',
    tableName: 'services',
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});
exports.serviceInit = serviceInit;
