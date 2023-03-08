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
};

export default date;
