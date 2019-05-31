import * as React from 'react';

import { Tab } from './Tab';
import { ActiveTabIndicator } from './ActiveTabIndicator';

import './TabGroup.scss';

interface Props {
  selectedTabIndex?: number;
}

interface State {
  activeTabIndex: number;
  previousTabIndex: number;
}

export class TabGroup extends React.Component<Props, State> {

  static defaultProps = {
    selectedTabIndex: 0
  };

  tabs: Tab[] = [];

  constructor(props: any) {
    super(props);
    this.state = {
      activeTabIndex: props.selectedTabIndex,
      previousTabIndex: props.selectedTabIndex
    };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.selectedTabIndex !== prevProps.selectedTabIndex)
      this.setState(prevState => ({
        previousTabIndex: prevState.activeTabIndex,
        activeTabIndex: this.props.selectedTabIndex
      }));
  }

  render() {
    // If there is only one <Tab></Tab> as children
    // then this.props.children will be an object instead of an array
    // so, convert it to an array no matter what
    const tabs = (Array.isArray(this.props.children) ? this.props.children : [this.props.children]) as Tab[];
    const { activeTabIndex, previousTabIndex } = this.state;
    return (
      <div className='tabgroup'>
        <header className='tabgroup__header'>
          {
            tabs.map((tab, index) => (
              <div key={index}
                className={`tabgroup__header__label tab-label-${index} ${activeTabIndex === index ? ' active' : ''}`}
                onClick={() => this.setSelectedTabIndex(index)}>
                {tab.props.label}
              </div>
            ))
          }
          <ActiveTabIndicator activeTabIndex={this.state.activeTabIndex} />
        </header>
        <div className='tabgroup__body'>
          <div className='tabgroup__body__wrapper'>
            <div className='tabgroup__body__slider'
              style={{ transform: `translateX(${-activeTabIndex * 100}%)` }}>
              {
                tabs.map((tab, index) => (
                  <div key={index}
                    className={`tab-content tab-content-${index}`}
                    style={{
                      visibility: activeTabIndex === index || previousTabIndex === index ? 'visible' : 'hidden'
                    }}>
                    {tab.props.children}
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  setSelectedTabIndex(index: number) {
    this.setState(prevState => {
      if (prevState.activeTabIndex !== index)
        return {
          activeTabIndex: index,
          previousTabIndex: prevState.activeTabIndex
        };
      return null;
    });
  }

}