
import './DialogActionGroup.light.scss';
import './DialogActionGroup.dark.scss';

interface Props {
  children: React.ReactChild | React.ReactChild[];
}

export function DialogActionGroup(props: Props) {
  return (
    <div className='dialog-action-group'>
      {
        props.children
      }
    </div>
  );
}
