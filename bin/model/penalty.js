"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Penalty = exports.penaltyInit = void 0;
const sequelize_1 = require("sequelize");
const user_1 = require("./user");
class Penalty extends sequelize_1.Model {
    static associate() {
        this.belongsTo(user_1.User);
    }
}
exports.Penalty = Penalty;
const penaltyInit = (sequelize) => Penalty.init({
    paper: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        unique: false,
        defaultValue: 0,
    },
    weekend: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: false,
    },
    payed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
        unique: false,
        defaultValue: true,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Penalty',
    tableName: 'penaltys',
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});
exports.penaltyInit = penaltyInit;
