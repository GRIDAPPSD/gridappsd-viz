import * as React from 'react';

import './ActiveTabIndicator.scss';

interface Props {
  activeTabIndex: number;
}

interface State {
  tabLabels: NodeListOf<HTMLElement>;
}

export class ActiveTabIndicator extends React.Component<Props, State> {

  currentWidth = 500;

  constructor(props: any) {
    super(props);
    this.state = {
      tabLabels: null
    };
  }

  componentDidMount() {
    this.setState({
      tabLabels: document.querySelectorAll('.tabgroup__header__label')
    });
  }

  render() {
    if (!this.state.tabLabels)
      return null;
    const activeTab = this.state.tabLabels[this.props.activeTabIndex];
    return (
      <div className='tabgroup__active-tab-indicator'
        style={{
          // minus 4 because it has 2 px border
          transform: `translateX(${activeTab.offsetLeft - 2}px)`,
          width: activeTab.clientWidth + 'px'
        }}>
        <div className='tabgroup__active-tab-indicator__rubber-band' />
      </div>
    );
  }
}