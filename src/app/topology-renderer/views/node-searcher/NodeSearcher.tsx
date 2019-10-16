import * as React from 'react';

import { Backdrop } from '@shared/backdrop';
import { PortalRenderer } from '@shared/portal-renderer';
import { Fade } from '@shared/fade';
import { Input } from '@shared/form';
import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';
import { Node } from '@shared/topology';
import { fuzzySearch, FuzzySearchResult } from '@shared/misc';
import { Ripple } from '@shared/ripple';

import './NodeSearcher.scss';

interface Props {
  show: boolean;
  nodes: Node[];
  onClose: () => void;
  onNodeSelected: (node: Node) => void;
}

interface State {
  show: boolean;
  searchTerm: string;
  matches: Array<{ node: Node; result: FuzzySearchResult; }>;
}

export class NodeSearcher extends React.Component<Props, State> {

  nodeSearcherElement: HTMLElement;

  private _matchedNodes: Set<Node>;
  private _previousSearchTerm = '';

  constructor(props: Props) {
    super(props);

    this.state = {
      show: undefined,
      searchTerm: '',
      matches: []
    };

    this._matchedNodes = new Set(props.nodes);

    this.close = this.close.bind(this);
    this.onSearchTermChanged = this.onSearchTermChanged.bind(this);
    this.clear = this.clear.bind(this);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.show !== prevProps.show) {
      this.setState({
        show: this.props.show
      });
      if (this.props.show)
        setTimeout(() => {
          this.nodeSearcherElement.querySelector('input').focus();
        }, 1250);
    }
  }

  render() {
    if (this.state.show === undefined)
      return null;
    return (
      <PortalRenderer>
        <Fade in={this.state.show}>
          <div
            ref={ref => this.nodeSearcherElement = ref}
            className={'node-searcher ' + (this.state.show ? 'show' : 'hide')}>
            <Backdrop visible={true} />
            <svg
              className='node-searcher__close'
              width='40'
              height='40'
              onClick={this.close}>
              <line
                className='node-searcher__close__line'
                x1='5'
                y1='20'
                x2='35'
                y2='20' />
              <line
                className='node-searcher__close__line'
                x1='5'
                y1='20'
                x2='35'
                y2='20' />
            </svg>
            <div className='node-searcher__body'>
              <div className='node-searcher__body__search'>
                <Input
                  label='Node name or MRID'
                  name='search-term'
                  value={this.state.searchTerm}
                  onChange={this.onSearchTermChanged} />
                <Tooltip content='Clear'>
                  <IconButton
                    icon='close'
                    style='accent'
                    size='small'
                    onClick={this.clear} />
                </Tooltip>
              </div>
              <ul className='node-searcher__body__search-result-container'>
                {
                  this.state.matches.map((matchedNode, index) => (
                    <Ripple key={index}>
                      <li
                        className='node-searcher__body__search-result'
                        onClick={() => {
                          this.props.onNodeSelected(matchedNode.node);
                          this.close();
                        }}>
                        {this.renderMatchedNode(matchedNode)}
                      </li>
                    </Ripple>
                  ))
                }
              </ul>
            </div>
          </div>
        </Fade>
      </PortalRenderer>
    );
  }

  close() {
    this.setState({
      show: false
    });
    setTimeout(this.props.onClose, 500);
  }

  onSearchTermChanged(searchTerm: string) {
    this.setState({
      searchTerm
    });

    const matches: Array<{ node: Node; result: FuzzySearchResult; }> = [];
    const searcher = fuzzySearch(searchTerm, true);

    if (searchTerm.length < this._previousSearchTerm.length || this._matchedNodes.size === 0)
      this._matchedNodes = new Set(this.props.nodes);

    this._previousSearchTerm = searchTerm;

    for (const node of this._matchedNodes) {
      const result = searcher(node.name);
      if (result)
        matches.push({
          node,
          result
        });
      else if ('mRIDs' in node) {
        const matchedMRIDs = [];
        for (const mRID of node.mRIDs) {
          const searchResult = searcher(mRID);
          if (searchResult)
            matchedMRIDs.push({
              node,
              result: searchResult
            });
        }
        if (matchedMRIDs.length > 0)
          matches.push(...matchedMRIDs);
        else
          this._matchedNodes.delete(node);
      } else {
        this._matchedNodes.delete(node);
      }
    }
    this.setState({
      matches: matches.sort((a, b) => a.result.inaccuracy - b.result.inaccuracy || a.result.boundaries[1].start - b.result.boundaries[1].start)
    });
  }

  clear() {
    this.setState({
      searchTerm: '',
      matches: []
    });
    this._previousSearchTerm = '';
    this._matchedNodes = new Set(this.props.nodes);
  }

  renderMatchedNode(matchedNode: { node: Node; result: FuzzySearchResult; }) {
    const common = matchedNode.result.boundaries.map((boundary, i) => {
      if (boundary.highlight)
        return (
          <strong
            key={i}
            className='node-searcher__body__search-result__match'>
            {matchedNode.result.input.substring(boundary.start, boundary.end)}
          </strong>
        );
      return (
        <React.Fragment key={i}>
          {matchedNode.result.input.substring(boundary.start, boundary.end)}
        </React.Fragment>
      );
    });
    // The match was for node name
    if (matchedNode.result.input === matchedNode.node.name)
      return common;
    // The match was for MRID
    return (
      <>
        {
          matchedNode.node.name
        }
        <ul>
          <li>
            {common}
          </li>
        </ul>
      </>
    );

  }
}
