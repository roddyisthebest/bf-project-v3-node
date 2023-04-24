import moment from 'moment';

const date = {
  thisWeekendToString: function () {
    return moment().day(0).format('YYYY-MM-DD');
  },
  startOfToday: function () {
    return moment().format('YYYY-MM-DD 00:00');
  },
  endOfToday: function () {
    return moment().format('YYYY-MM-DD 23:59');
  },
  isItSunday: function () {
    return moment().day() === 0;
  },
  weekOfMonth: function (m: string) {
    return moment(m).week() - moment(m).startOf('month').week() + 1;
  },
  isThisMonthOdd: function () {
    return (moment().month() + 1) % 2 === 1;
  },
};

export default date;
