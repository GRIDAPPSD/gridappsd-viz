import { Fade } from '@client:common/effects/fade';

import './Backdrop.light.scss';
import './Backdrop.dark.scss';

interface Props {
  visible: boolean;
  transparent?: boolean;
  onClick?: () => void;
}

export function Backdrop({ visible, onClick = null, transparent = false }: Props) {
  return (
    <Fade in={visible}>
      <div
        className={`backdrop${transparent ? ' transparent' : ''}`}
        onClick={onClick} />
    </Fade>
  );
}
