import { MessageRequest } from '@client:common/MessageRequest';

export class ExpectedVsTimeSeriesRequest implements MessageRequest {

  readonly url: string;

  readonly requestBody = {
    appId: 'sample_app',
    testId: -1,
    compareWithSimId: -1,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expectedResults: null as any,
    testType: 'expected_vs_timeseries'
  };

  readonly replyTo: string;

  constructor(expectedResults: unknown, simulationId: number) {
    const testId = Math.trunc(Math.random() * 1_000_000);
    this.url = `/topic/goss.gridappsd.simulation.test.input.${testId}`;
    this.requestBody.testId = testId;
    this.requestBody.expectedResults = expectedResults;
    this.requestBody.compareWithSimId = simulationId;
    this.replyTo = `/topic/goss.gridappsd.simulation.test.output.${testId}`;
  }

}
