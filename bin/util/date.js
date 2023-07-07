"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const date = {
    thisWeekendToString: function () {
        return (0, moment_1.default)().day(0).format('YYYY-MM-DD');
    },
    startOfToday: function () {
        return (0, moment_1.default)().format('YYYY-MM-DD 00:00');
    },
    endOfToday: function () {
        return (0, moment_1.default)().format('YYYY-MM-DD 23:59');
    },
    isItSunday: function () {
        return (0, moment_1.default)().day() === 0;
    },
    weekOfMonth: function (m) {
        return (0, moment_1.default)(m).week() - (0, moment_1.default)(m).startOf('month').week() + 1;
    },
    isThisMonthOdd: function () {
        return ((0, moment_1.default)().month() + 1) % 2 === 1;
    },
};
exports.default = date;
