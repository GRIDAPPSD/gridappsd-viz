export interface TopologyProcessorOutputMessage {
  feeder_id: string;
  timestamp: number;
  feeders: any;
  islands: any;
}

// # https://stackoverflow.com/questions/12710905/how-do-i-dynamically-assign-properties-to-an-object-in-typescript
// interface Feeders {
//   [key: string]:
// }

// export interface TopologyProcessorOutputMessage {
//   feeder_id: string;
//   timestamp: number;
//   feeders: Feeders;
//   islands: any;
// }
