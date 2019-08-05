import * as React from 'react';

import './ActiveTabIndicator.scss';

interface Props {
  activeTabIndex: number;
  tabGroup: HTMLElement;
}

interface State {
  tabLabels: NodeListOf<HTMLElement>;
}

export class ActiveTabIndicator extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      tabLabels: null
    };
  }

  componentDidMount() {
    this.setState({
      tabLabels: this.queryTabLabels()
    });
  }

  render() {
    const tabLabels = this.queryTabLabels();
    if (!tabLabels)
      return null;
    const activeTab = tabLabels[this.props.activeTabIndex];
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

  queryTabLabels(): NodeListOf<HTMLElement> {
    return this.props.tabGroup ? this.props.tabGroup.querySelectorAll('.tabgroup__header__label') as any : this.state.tabLabels;
  }

}
