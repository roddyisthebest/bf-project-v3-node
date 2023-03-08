import moment from 'moment';

const date = {
  thisWeekend: function () {
    return moment().day(0).format('YYYY-MM-DD');
  },
};

export default date;
