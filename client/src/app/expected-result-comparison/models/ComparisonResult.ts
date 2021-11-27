export interface ComparisonResult {
  object: string;
  attribute: string;
  indexOne: number;
  indexTwo: number;
  simulationTimestamp: number;
  expected: string;
  actual: string;
  diffMrid: string;
  diffType: string;
  match: boolean;
}
