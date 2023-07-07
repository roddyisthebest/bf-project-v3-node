"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pray = exports.prayInit = void 0;
const sequelize_1 = require("sequelize");
const user_1 = require("./user");
class Pray extends sequelize_1.Model {
    static associate() {
        this.belongsTo(user_1.User);
    }
}
exports.Pray = Pray;
const prayInit = (sequelize) => Pray.init({
    content: {
        type: sequelize_1.DataTypes.STRING,
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
    modelName: 'Pray',
    tableName: 'prays',
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});
exports.prayInit = prayInit;
