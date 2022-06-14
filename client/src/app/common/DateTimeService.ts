import { timeFormat, timeParse } from 'd3-time-format';

export const enum TimeZone {
  EDT = 'EDT',
  EST = 'EST',
  PDT = 'PDT',
  PST = 'PST',
  UTC = 'UTC',
  LOCAL = 'LOCAL'
}

export class DateTimeService {

  private static readonly _INSTANCE_ = new DateTimeService();

  private readonly _formatter = timeFormat('%Y-%m-%d %H:%M:%S');
  private readonly _parserRegular = timeParse('%Y-%m-%d %H:%M:%S');
  private readonly _parserWithMilliseconds = timeParse('%Y-%m-%d %H:%M:%S.%L');

  private _timeZone = this._restoreSavedTimeZone();
  private _timeZoneOffsetInMilliseconds = 0;
  private _timeZoneOffsetGMTInHours = 0;

  private _restoreSavedTimeZone() {
    const savedTimeZone = localStorage.getItem('timeZone') as TimeZone || TimeZone.LOCAL;
    this.setTimeZone(savedTimeZone);
    return savedTimeZone;
  }

  static getInstance() {
    return DateTimeService._INSTANCE_;
  }

  setTimeZone(timeZone: TimeZone) {
    localStorage.setItem('timeZone', timeZone);
    this._timeZone = timeZone;

    switch (timeZone) {
      case TimeZone.LOCAL:
        this._timeZoneOffsetInMilliseconds = 0;
        this._timeZoneOffsetGMTInHours = new Date().getTimezoneOffset() / 60;
        break;
      case TimeZone.UTC:
        this._timeZoneOffsetInMilliseconds = new Date().getTimezoneOffset() * 60 * 1000;
        this._timeZoneOffsetGMTInHours = 0;
        break;
      case TimeZone.EDT:
        // Eastern Daylight time is 4 hours behind UTC
        this._timeZoneOffsetInMilliseconds = new Date().getTimezoneOffset() * 60 * 1000 - 4 * 60 * 60 * 1000;
        this._timeZoneOffsetGMTInHours = 4;
        break;
      case TimeZone.PDT:
        // Pacific Daylight time is 7 hours behind UTC
        this._timeZoneOffsetInMilliseconds = new Date().getTimezoneOffset() * 60 * 1000 - 7 * 60 * 60 * 1000;
        this._timeZoneOffsetGMTInHours = 7;
        break;
      case TimeZone.EST:
        this._timeZoneOffsetInMilliseconds = new Date().getTimezoneOffset() * 60 * 1000 - 5 * 60 * 60 * 1000;
        this._timeZoneOffsetGMTInHours = 8;
        break;
      case TimeZone.PST: {
        // We want to find the offset difference between user's time zone
        // and EST. GMT is 5 hours ahead of EST, and 8 hours ahead of PST
        this._timeZoneOffsetInMilliseconds = new Date().getTimezoneOffset() * 60 * 1000 - 8 * 60 * 60 * 1000;
        this._timeZoneOffsetGMTInHours = 5;
      }
    }
  }

  currentTimeZone() {
    return this._timeZone;
  }

  resolveDateTime(dateTime: Date) {
    return new Date(dateTime.getTime() + this._timeZoneOffsetInMilliseconds);
  }

  format(date: Date | number | string) {
    if (typeof date === 'number') {
      return this._formatter(this.resolveDateTime(new Date(date * 1000)));
    }
    if (date instanceof Date) {
      return this._formatter(this.resolveDateTime(date));
    }
    return date;
  }

  /**
   * Parse the given date time string and return epoch time in second precision
   *
   * @param str Date time string in YYYY-MM-DD HH:MM:SS or YYYY-MM-DD HH:MM:SS.LLL format
   */
  parse(str: string) {
    const parsedDateTime = !str.includes('.') ? this._parserRegular(str) : this._parserWithMilliseconds(str);
    return parsedDateTime ? (parsedDateTime.getTime() - this._timeZoneOffsetInMilliseconds) / 1000 : null;
  }

  convertToGMT(str: string) {
    const parsedDateTime = !str.includes('.') ? this._parserRegular(str) : this._parserWithMilliseconds(str);
    const offsetFromGmtInHours = this._timeZoneOffsetGMTInHours;
    return parsedDateTime ? (parsedDateTime.getTime() + offsetFromGmtInHours * 60 * 60 * 1000) / 1000 : null;
  }

  /**
   * Parse the given Epoch time number and return Date in user's time zone, YYYY-MM-DD HH:MM:SS
   *
   * @param epochTime Epoch time
   */
  parseEpoch(epochTime: number) {
    const userLocalEpochTime = epochTime - this._timeZoneOffsetGMTInHours * 60 * 60;
    const baseTime = new Date(userLocalEpochTime * 1000);
    const year = baseTime.getFullYear().toString();
    let month = (baseTime.getMonth() + 1).toString();
    let day = baseTime.getDate().toString();
    let hour = baseTime.getHours().toString();
    let minute = baseTime.getMinutes().toString();
    let second = baseTime.getSeconds().toString();
    if (month.length === 1) {
      month = '0' + month;
    }
    if (day.length === 1) {
      day = '0' + day;
    }
    if (hour.length === 1) {
      hour = '0' + hour;
    }
    if (minute.length === 1) {
      minute = '0' + minute;
    }
    if (second.length === 1) {
      second = '0' + second;
    }
    const dateTime = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
    return dateTime;
  }

}
