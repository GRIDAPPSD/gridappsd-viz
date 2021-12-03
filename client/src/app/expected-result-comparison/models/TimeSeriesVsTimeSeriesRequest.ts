import { MessageRequest } from '@client:common/MessageRequest';

export class TimeSeriesVsTimeSeriesRequest implements MessageRequest {

  readonly url: string;

  readonly requestBody = {
    appId: 'sample_app',
    testId: -1,
    compareWithSimId: -1,
    compareWithSimIdTwo: -1,
    testType: 'timeseries_vs_timeseries'
  };

  readonly replyTo: string;

  constructor(firstSimulationId: number, secondSimulationId: number) {
    const testId = Math.trunc(Math.random() * 1_000_000);

    this.url = `/topic/goss.gridappsd.simulation.test.input.${testId}`;
    this.requestBody.testId = testId;
    this.requestBody.compareWithSimId = firstSimulationId;
    this.requestBody.compareWithSimIdTwo = secondSimulationId;
    this.replyTo = `/topic/goss.gridappsd.simulation.test.output.${testId}`;

  }

}
