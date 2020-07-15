import { Phase } from '../Phase';

export interface CommOutageEvent {
  // eslint-disable-next-line camelcase
  event_type: 'CommOutage';
  tag: string;
  allInputOutage: boolean;
  inputList: CommOutageEventInputListItem[];
  allOutputOutage: boolean;
  outputList: CommOutageEventOutputListItem[];
  // Epoch time with second precision
  startDateTime: number | string;
  stopDateTime: number | string;
}


export interface CommOutageEventInputListItem {
  type: string;
  name: string;
  mRID: string | string[];
  phases: Phase[];
  attribute: string;
}

export interface CommOutageEventOutputListItem {
  type: string;
  name: string;
  mRID: string;
  phases: string[];
  measurementTypes: string[];
}
