
import './DialogContent.light.scss';
import './DialogContent.dark.scss';

interface Props {
  children: React.ReactChild | React.ReactNode;
  style?: React.CSSProperties;
}

export function DialogContent(props: Props) {
  return (
    <div
      className='dialog-content'
      style={{ ...(props.style || {}) }}>
      {props.children}
    </div>
  );
}
