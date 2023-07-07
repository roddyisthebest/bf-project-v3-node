"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Report = exports.reportInit = void 0;
const sequelize_1 = require("sequelize");
const user_1 = require("./user");
class Report extends sequelize_1.Model {
    static associate() {
        this.belongsTo(user_1.User);
    }
}
exports.Report = Report;
const reportInit = (sequelize) => Report.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        onDelete: 'cascade',
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        unique: false,
    },
    model: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        unique: false,
    },
    //   '{model:tweet,id:5}'
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Report',
    tableName: 'reports',
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});
exports.reportInit = reportInit;
