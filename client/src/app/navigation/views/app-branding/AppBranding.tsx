import { Link } from 'react-router-dom';

import './AppBranding.light.scss';
import './AppBranding.dark.scss';

interface Props {
  version: string;
}

export function AppBranding(props: Props) {
  return (
    <section className='app-branding'>
      <Link
        className='app-branding__app-title'
        to='/'>
        GridAPPS-D
      </Link>
      <span className='app-branding__app-version'>
        {props.version}
      </span>
    </section>
  );
}
