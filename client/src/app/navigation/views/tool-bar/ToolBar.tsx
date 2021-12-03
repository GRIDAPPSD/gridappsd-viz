
import './ToolBar.light.scss';
import './ToolBar.dark.scss';

export function ToolBar(props: { children: React.ReactChild | React.ReactChild[] }) {
  return (
    <nav className='tool-bar'>
      {props.children}
    </nav>
  );
}
