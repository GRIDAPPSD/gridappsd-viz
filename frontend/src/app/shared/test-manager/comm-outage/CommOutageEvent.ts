import { Phase } from '../Phase';

export interface CommOutageEvent {
  event_type: 'CommOutage';
  tag: string;
  allInputOutage: boolean;
  inputList: CommOutageEventInputListItem[];
  allOutputOutage: boolean;
  outputList: CommOutageEventOutputListItem[];
  // Epoch time with second precision
  startDateTime: number;
  stopDateTime: number;
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
