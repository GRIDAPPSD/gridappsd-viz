import { Phase } from './Phase';

export interface CommOutageEvent {
  type: 'CommOutage';
  tag: string;
  allInputOutage: boolean;
  inputList: CommOutageEventInputListItem[];
  allOutputOutage: boolean;
  outputList: CommOutageEventOutputListItem[];
  startDateTime: string;
  stopDateTime: string;
}


export interface CommOutageEventInputListItem {
  type: string;
  name: string;
  mRID: any;
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