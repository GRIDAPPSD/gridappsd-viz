import { timeFormat, timeParse } from 'd3-time-format';

export class DateTimeService {

  private static readonly _INSTANCE = new DateTimeService();

  private readonly _formatter = timeFormat('%Y-%m-%d %H:%M:%S');
  private readonly _parserRegular = timeParse('%Y-%m-%d %H:%M:%S');
  private readonly _parserWithMilliseconds = timeParse('%Y-%m-%d %H:%M:%S.%L');

  static getInstance() {
    return DateTimeService._INSTANCE;
  }

  format(date: Date | number | string) {
    if (typeof date === 'number') {
      return this._formatter(new Date(date * 1000));
    }
    if (date instanceof Date) {
      return this._formatter(date);
    }
    return date;
  }

  /**
   * Parse the given date time string and return epoch time in second precision
   * @param str Date time string in YYYY-MM-DD HH:MM:SS or YYYY-MM-DD HH:MM:SS.LLL format
   */
  parse(str: string) {
    const parsedDateTime = !str.includes('.') ? this._parserRegular(str) : this._parserWithMilliseconds(str);
    return parsedDateTime ? parsedDateTime.getTime() / 1000 : null;
  }

}
