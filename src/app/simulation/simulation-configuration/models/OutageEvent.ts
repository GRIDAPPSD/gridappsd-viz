export interface OutageEvent {
  type: 'CommOutage';
  id: string;
  allInputOutage: boolean;
  inputList: OutageEventInputListItem[];
  allOutputOutage: boolean;
  outputList: OutageEventOutputListItem[];
  startDateTime: string;
  stopDateTime: string;
}


export interface OutageEventInputListItem {
  type: string;
  name: string;
  mRID: string;
  phases: string[];
  attribute: string;
}

export interface OutageEventOutputListItem {
  type: string;
  name: string;
  mRID: string;
  phases: string[];
  measurementTypes: string[];
}