import './ActiveTabIndicator.light.scss';
import './ActiveTabIndicator.dark.scss';

interface Props {
  activeTab: HTMLElement;
}

export function ActiveTabIndicator(props: Props) {
  if (!props.activeTab) {
    return null;
  }
  const leftEdgeOfActiveTab = props.activeTab.offsetLeft;
  // The container for tab lables can overflow and scroll
  // So we need to know how much to the right it has scrolled,
  // We get this distance, and subtract it from the left edge of the
  // active tab currently on screen to position the indicator correctly
  const offset = props.activeTab.parentElement ? props.activeTab.parentElement.scrollLeft : 0;
  return (
    <div
      className='tab-group__active-tab-indicator'
      style={{
        // minus 2 because it has 2px border
        transform: `translateX(${leftEdgeOfActiveTab - offset - 2}px)`,
        width: props.activeTab.clientWidth + 'px'
      }}>
    </div>
  );
}
