import { Node } from '@client:common/topology';

export interface Edge {
  name: string;
  from: Node;
  to: Node;
}
