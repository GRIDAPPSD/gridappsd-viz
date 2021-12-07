import { Application } from '@client:common/Application';

import './AvailableApplicationListItem.light.scss';
import './AvailableApplicationListItem.dark.scss';

interface Props {
  application: Application;
}

export function AvailableApplicationListItem(props: Props) {
  return (
    <tr className='available-application-list-item'>
      <td className='available-application-list-item__id'>
        <div>
          {props.application.id}
        </div>
      </td>
      <td className='available-application-list-item__description'>
        <div>
          {props.application.description}
        </div>
      </td>
      <td className='available-application-list-item__creator'>
        <div>
          {props.application.creator}
        </div>
      </td>
    </tr>
  );

}
