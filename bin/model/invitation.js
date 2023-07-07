"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationInit = exports.Invitation = void 0;
const sequelize_1 = require("sequelize");
const team_1 = require("./team");
const user_1 = require("./user");
class Invitation extends sequelize_1.Model {
    static associate() {
        this.belongsTo(user_1.User, {
            onDelete: 'cascade',
        });
        this.belongsTo(team_1.Team, {
            onDelete: 'cascade',
        });
    }
}
exports.Invitation = Invitation;
const invitationInit = (sequelize) => Invitation.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    active: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Invitation',
    tableName: 'invitations',
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});
exports.invitationInit = invitationInit;
