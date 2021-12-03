import { Component } from 'react';

import { IconButton } from '@client:common/buttons';
import { Tooltip } from '@client:common/tooltip';
import { Ripple } from '@client:common/ripple';
import { copyToClipboard } from '@client:common/misc';
import { DateTimeService } from '@client:common/DateTimeService';
import { MessageBanner } from '@client:common/overlay/message-banner';
import { AuthenticatorService } from '@client:common/authenticator';

import { Alarm } from './models/Alarm';

import './Alarms.light.scss';
import './Alarms.dark.scss';

interface Props {
  alarms: Alarm[];
  onAcknowledgeAlarm: (alarm: Alarm) => void;
  onLocateNodeForAlarm: (alarm: Alarm) => void;
}

interface State {
}

export class Alarms extends Component<Props, State> {

  readonly existingCreatedByMap = new Map<string, number>();
  readonly dateTimeFormatter = DateTimeService.getInstance();

  constructor(props: Props) {
    super(props);

    this.state = {
    };

    this.renderAlarm = this.renderAlarm.bind(this);
  }

  render() {
    if (this.props.alarms.length === 0) {
      return (
        <MessageBanner>
          No data available
        </MessageBanner>
      );
    }
    return (
      <section className='alarms'>
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Action</th>
              <th>Timestamp</th>
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
    if (!this.existingCreatedByMap.has(alarm.created_by)) {
      this.existingCreatedByMap.set(alarm.created_by, this.existingCreatedByMap.size + 1);
    }
    const createdByIndex = this.existingCreatedByMap.get(alarm.created_by);

    return (
      <tr key={index}>
        <td>{index + 1}</td>
        <td>
          <Tooltip content='Acknowledge'>
            <IconButton
              className='alarms__action'
              icon='check'
              size='small'
              onClick={() => this.props.onAcknowledgeAlarm(alarm)} />
          </Tooltip>
          <Tooltip content='Locate node'>
            <IconButton
              className='alarms__action'
              icon='search'
              size='small'
              onClick={() => this.props.onLocateNodeForAlarm(alarm)} />
          </Tooltip>
        </td>
        <td>
          {this.dateTimeFormatter.format(alarm.timestamp)}
        </td>
        <Tooltip content='Copy MRID to clipboard'>
          <Ripple>
            <td onClick={() => copyToClipboard(alarm.equipment_mrid)}>
              {alarm.equipment_mrid}
            </td>
          </Ripple>
        </Tooltip>
        <Tooltip content='Copy equipment name to clipboard'>
          <Ripple>
            <td onClick={() => copyToClipboard(alarm.equipment_name)}>
              {alarm.equipment_name}
            </td>
          </Ripple>
        </Tooltip>
        <td className={`alarms__created-by color-${createdByIndex}`}>
          {AuthenticatorService.decodePayloadFromAuthenticationToken(alarm.created_by).sub}
        </td>
        <td>{alarm.value}</td>
      </tr>
    );
  }

}
