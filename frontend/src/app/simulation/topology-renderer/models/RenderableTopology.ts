import { Edge, Node } from '@shared/topology';

export interface RenderableTopology {
  name: string;
  nodes: Node[];
  edges: Edge[];
  inverted: boolean;
}
