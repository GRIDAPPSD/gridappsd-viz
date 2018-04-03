import { TopologyModel } from "./topology/TopologyModel";

export interface GetTopologyModelRequestPayload {
  data: TopologyModel;
  id: string;
  responseComplete: boolean;
}