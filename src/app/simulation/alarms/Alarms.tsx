import * as React from 'react';

import { Alarm } from './models/Alarm';
import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';
import { Ripple } from '@shared/ripple';
import { copyToClipboard } from '@shared/misc';

import './Alarms.light.scss';
import './Alarms.dark.scss';

interface Props {
  onAcknowledgeAlarm: (alarm: Alarm) => void;
  alarms: Alarm[];
}

interface State {
}

export class Alarms extends React.Component<Props, State> {

  readonly existingCreatedByMap = new Map<string, number>();

  constructor(props: Props) {
    super(props);

    this.state = {
    };

    this.renderAlarm = this.renderAlarm.bind(this);
  }

  render() {
    return (
      <section className='alarms'>
        <table>
          <thead>
            <tr>
              <th></th>
              <th></th>
              <th>Equipment MRID</th>
              <th>Equipment Name</th>
              <th>Created By</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {
              this.props.alarms.map(this.renderAlarm)
            }
          </tbody>
        </table>
      </section>
    );
  }

  renderAlarm(alarm: Alarm, index: number) {
    if (!this.existingCreatedByMap.has(alarm.created_by))
      this.existingCreatedByMap.set(alarm.created_by, this.existingCreatedByMap.size + 1);
    const createdByIndex = this.existingCreatedByMap.get(alarm.created_by);

    return (
      <tr key={index}>
        <td>
          <Tooltip content='Acknowledge'>
            <IconButton
              icon='check'
              size='small'
              onClick={() => this.props.onAcknowledgeAlarm(alarm)} />
          </Tooltip>
        </td>
        <td>{index + 1}</td>
        <Ripple>
          <td onClick={() => copyToClipboard(alarm.equipment_mrid)}>
            {alarm.equipment_mrid}
          </td>
        </Ripple>
        <Ripple>
          <td onClick={() => copyToClipboard(alarm.equipment_name)}>
            {alarm.equipment_name}
          </td>
        </Ripple>
        <td className={`alarms__created-by color-${createdByIndex}`}>{alarm.created_by}</td>
        <td>{alarm.value}</td>
      </tr>
    );
  }

}
