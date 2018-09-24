import { Node } from './Node';

export interface Edge {
  name: string;
  from: Node;
  to: Node;
  data: any;
}