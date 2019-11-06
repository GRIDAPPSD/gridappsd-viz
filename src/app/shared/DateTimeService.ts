import { timeFormat, timeParse } from 'd3';

export class DateTimeService {

  private static readonly _INSTANCE = new DateTimeService();

  private readonly _formatter = timeFormat('%Y-%m-%d %H:%M:%S');
  private readonly _parser = timeParse('%Y-%m-%d %H:%M:%S');

  static getInstance() {
    return DateTimeService._INSTANCE;
  }

  format(date: Date | number) {
    if (typeof date === 'number')
      return this._formatter(new Date(date * 1000));
    return this._formatter(date);
  }

  parse(dateString: string) {
    return this._parser(dateString);
  }

}
