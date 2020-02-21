import * as React from 'react';

import { Backdrop } from '@shared/backdrop';
import { PortalRenderer } from '@shared/portal-renderer';
import { Fade } from '@shared/fade';
import { Input, FormControlModel } from '@shared/form';
import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';
import { Node } from '@shared/topology';
import { fuzzySearch, FuzzySearchResult } from '@shared/misc';
import { Ripple } from '@shared/ripple';
import { Paginator } from '@shared/paginator';

import './NodeSearcher.light.scss';
import './NodeSearcher.dark.scss';

interface Props {
  show: boolean;
  nodes: Node[];
  onNodeSelected: (node: Node) => boolean;
  onClose: () => void;
}

interface State {
  show: boolean;
  matches: Match[];
  visibleMatches: Match[];
}

interface Match {
  node: Node;
  result: FuzzySearchResult;
}

export class NodeSearcher extends React.Component<Props, State> {

  readonly searchTermFormControlModel = new FormControlModel('');
  readonly nodeSearcherElementRef = React.createRef<HTMLDivElement>();

  private _matchedNodes: Set<Node>;
  private _previousSearchTerm = '';

  constructor(props: Props) {
    super(props);

    this.state = {
      show: undefined,
      matches: [],
      visibleMatches: []
    };

    this._matchedNodes = new Set(props.nodes);

    this.close = this.close.bind(this);
    this.clear = this.clear.bind(this);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.show !== prevProps.show) {
      this.setState({
        show: this.props.show
      });
      if (this.props.show) {
        // Because we don't clear the entered search term when this component is hidden,
        // so if the user searched for something, closed this component, and opened it again,
        // then pasted a longer search term into the input, we want to search through the input
        // list of nodes rather than the cache of currently matched nodes by clearning
        // this cache
        this._matchedNodes.clear();
        setTimeout(() => {
          this.nodeSearcherElementRef.current.querySelector('input').focus();
        }, 1000);
      }
    }
  }

  componentDidMount() {
    this.searchTermFormControlModel.valueChanges()
      .subscribe({
        next: searchTerm => this._onSearchTermChange(searchTerm)
      });
  }

  private _onSearchTermChange(searchTerm: string) {
    const matches: Match[] = [];
    const searcher = fuzzySearch(searchTerm, true);

    if (searchTerm.length < this._previousSearchTerm.length || this._matchedNodes.size === 0) {
      this._matchedNodes = new Set(this.props.nodes);
    }

    this._previousSearchTerm = searchTerm;

    for (const node of this._matchedNodes) {
      const result = searcher(node.name);
      if (result) {
        matches.push({
          node,
          result
        });
      } else if ('mRIDs' in node) {
        const matchedMRIDs = [];
        for (const mRID of node.mRIDs) {
          const searchResult = searcher(mRID);
          if (searchResult) {
            matchedMRIDs.push({
              node,
              result: searchResult
            });
          }
        }
        if (matchedMRIDs.length > 0) {
          matches.push(...matchedMRIDs);
        } else {
          this._matchedNodes.delete(node);
        }
      } else {
        this._matchedNodes.delete(node);
      }
    }
    this.setState({
      matches: matches.sort((a, b) => {
        if (a.result.inaccuracy === b.result.inaccuracy) {
          // If both matches have the same inaccuracy
          // we want to sort them by their inputs' length,
          // the one with shorter input should come first,
          // if their input lengths are the same,
          // then we want to sort them by their start of the first matched boundary
          return a.result.input.length - b.result.input.length || a.result.boundaries[1].start - b.result.boundaries[1].start;
        }
        return a.result.inaccuracy - b.result.inaccuracy;
      })
    });
  }


  componentWillUnmount() {
    this.searchTermFormControlModel.cleanup();
  }

  render() {
    if (this.state.show === undefined) {
      return null;
    }
    return (
      <PortalRenderer>
        <Fade in={this.state.show}>
          <div
            ref={this.nodeSearcherElementRef}
            className={'node-searcher ' + (this.state.show ? 'show' : 'hide')}>
            <Backdrop visible={this.state.show} />
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
                  formControlModel={this.searchTermFormControlModel} />
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
                  this.state.visibleMatches.map((matchedNode, index) => (
                    <Ripple key={index}>
                      <li
                        className='node-searcher__body__search-result'
                        onClick={() => {
                          if (this.props.onNodeSelected(matchedNode.node)) {
                            this.close();
                          }
                        }}>
                        {this.renderMatchedNode(matchedNode)}
                      </li>
                    </Ripple>
                  ))
                }
              </ul>
            </div>
            <Paginator
              items={this.state.matches}
              onPageChanged={page => this.setState({ visibleMatches: page })} />
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
    const matches: Match[] = [];
    const searcher = fuzzySearch(searchTerm, true);

    if (searchTerm.length < this._previousSearchTerm.length || this._matchedNodes.size === 0) {
      this._matchedNodes = new Set(this.props.nodes);
    }

    this._previousSearchTerm = searchTerm;

    for (const node of this._matchedNodes) {
      const result = searcher(node.name);
      if (result) {
        matches.push({
          node,
          result
        });
      } else if ('mRIDs' in node) {
        const matchedMRIDs = [];
        for (const mRID of node.mRIDs) {
          const searchResult = searcher(mRID);
          if (searchResult) {
            matchedMRIDs.push({
              node,
              result: searchResult
            });
          }
        }
        if (matchedMRIDs.length > 0) {
          matches.push(...matchedMRIDs);
        } else {
          this._matchedNodes.delete(node);
        }
      } else {
        this._matchedNodes.delete(node);
      }
    }
    this.setState({
      matches: matches.sort((a, b) => {
        if (a.result.inaccuracy === b.result.inaccuracy) {
          // If both matches have the same inaccuracy
          // we want to sort them by their inputs' length,
          // the one with shorter input should come first,
          // if their input lengths are the same,
          // then we want to sort them by their start of the first matched boundary
          return a.result.input.length - b.result.input.length || a.result.boundaries[1].start - b.result.boundaries[1].start;
        }
        return a.result.inaccuracy - b.result.inaccuracy;
      })
    });
  }

  clear() {
    this.searchTermFormControlModel.setValue('');
    this.setState({
      matches: []
    });
    this._previousSearchTerm = '';
    this._matchedNodes = new Set(this.props.nodes);
  }

  renderMatchedNode(matchedNode: Match) {
    const common = matchedNode.result.boundaries.map((boundary, i) => {
      if (boundary.highlight) {
        return (
          <strong
            key={i}
            className='node-searcher__body__search-result__match'>
            {matchedNode.result.input.substring(boundary.start, boundary.end)}
          </strong>
        );
      }
      return (
        <React.Fragment key={i}>
          {matchedNode.result.input.substring(boundary.start, boundary.end)}
        </React.Fragment>
      );
    });
    // The match was for node name
    if (matchedNode.result.input === matchedNode.node.name) {
      return common;
    }
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
