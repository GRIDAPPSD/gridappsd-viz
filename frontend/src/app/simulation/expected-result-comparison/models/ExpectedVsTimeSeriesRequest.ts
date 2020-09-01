/* eslint-disable camelcase */
import { MessageRequest } from '@shared/MessageRequest';

export class ExpectedVsTimeSeriesRequest implements MessageRequest {

  readonly url: string;

  readonly requestBody = {
    appId: 'sample_app',
    testId: -1,
    compareWithSimId: -1,
    expectedResults: null,
    testType: 'expected_vs_timeseries'
  };

  readonly replyTo: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(expectedResults: any, simulationId: number) {
    const testId = (Math.random() * 1_000_000) | 0;
    this.url = `/topic/goss.gridappsd.simulation.test.input.${testId}`;
    this.requestBody.testId = testId;
    this.requestBody.expectedResults = expectedResults;
    this.requestBody.compareWithSimId = simulationId;
    this.replyTo = `/topic/goss.gridappsd.simulation.test.output.${testId}`;
  }

}
