import * as React from 'react';
import { createPortal, render, unmountComponentAtNode } from 'react-dom';

import './PortalRenderer.light.scss';
import './PortalRenderer.dark.scss';

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
    portal: document.body
  } as Props;

  readonly container = document.createElement('div');

  constructor(props: Props = PortalRenderer.defaultProps) {
    super(props);

    this.container.className = this.props.containerClassName || 'portal-renderer';
    props.portal.appendChild(this.container);

    this.unmount = this.unmount.bind(this);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.containerClassName !== prevProps.containerClassName) {
      this.container.className = this.props.containerClassName || 'portal-renderer';
    }
  }

  render() {
    return createPortal(this.props.children, this.container);
  }

  componentWillUnmount() {
    if (this.props.portal.contains(this.container)) {
      this.props.portal.removeChild(this.container);
    }
  }

  mount(component: React.ReactElement<HTMLElement>) {
    render(component, this.container);
  }

  unmount() {
    if (this.props.portal.contains(this.container)) {
      this.props.portal.removeChild(this.container);
    }
    unmountComponentAtNode(this.container);
  }

}
