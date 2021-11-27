import { Edge, Node } from '@shared/topology';

export interface RenderableTopology {
  name: string;
  nodeMap: Map<string, Node>;
  edgeMap: Map<string, Edge>;
  inverted: boolean;
}
