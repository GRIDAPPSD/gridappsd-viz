import * as React from 'react';
import { createPortal, render, unmountComponentAtNode } from 'react-dom';

import './PortalRenderer.scss';

interface Props {
  containerClassName?: string;
  portal?: HTMLElement;
}

interface State {
}

/**
 * Render props.children into a portal
 */
export class PortalRenderer extends React.Component<Props, State> {

  static defaultProps = {
    containerClassName: 'portal-renderer',
    portal: document.body
  } as Props;

  readonly container = document.createElement('div');

  constructor(props: Props) {
    super(props);

    this.container.className = props.containerClassName;
    props.portal.appendChild(this.container);
  }

  render() {
    return createPortal(this.props.children, this.container);
  }

  componentWillUnmount() {
    this.props.portal.removeChild(this.container);
  }

  mount(component: React.ReactElement<HTMLElement>, containerClassName?: string) {
    this.container.className = containerClassName || this.props.containerClassName;
    render(component, this.container);
  }

  unmount() {
    this.props.portal.removeChild(this.container);
    unmountComponentAtNode(this.container);
  }

}
