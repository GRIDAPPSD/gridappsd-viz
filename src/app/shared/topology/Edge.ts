import { Node } from '@shared/topology';

export interface Edge {
  name: string;
  from: Node;
  to: Node;
  type: string;
}