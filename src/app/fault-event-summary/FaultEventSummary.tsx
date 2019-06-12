import * as React from 'react';

import { Tooltip } from '@shared/tooltip';
import { IconButton } from '@shared/buttons';
import { StateStore } from '@shared/state-store';

import './FaultEventSummary.scss';

interface Props {
}

interface State {
  outageEvents: any[];
  faultEvents: any[];
  faultMRIDs: string[];
}

export class FaultEventSummary extends React.Component<Props, State> {

  private readonly _stateStore = StateStore.getInstance();

  constructor(props: Props) {
    super(props);
    this.state = {
      outageEvents: [],
      faultEvents: [],
      faultMRIDs: []
    };
  }

  componentDidMount() {
    this._stateStore.select(state => state.outageEvents)
      .subscribe({
        next: (events: any[]) => this.setState({ outageEvents: events })
      });
    this._stateStore.select(state => state.faultEvents)
      .subscribe({
        next: (events: any[]) => this.setState({ faultEvents: events })
      });
    this._stateStore.select(state => state.startSimulationResponse)
      .subscribe({
        next: state => this.setState({ faultMRIDs: state.events.map(e => e.faultMRID) })
      });
  }

  render() {
    return (
      <div className='fault-event-summary'>
        {
          this.state.outageEvents.length > 0 &&
          <table className='outage-event-summary-table'>
            <caption>CommOutage</caption>
            <thead>
              <tr>
                <th rowSpan={2}>Action</th>
                <th rowSpan={2}>Fault MRID</th>
                <th rowSpan={2}>Event Tag</th>
                <th colSpan={4}>Input List</th>
                <th colSpan={6}>Output List</th>
              </tr>
              <tr>
                {/* Input List*/}
                <th>Equipment Type</th>
                <th>Equipment Name</th>
                <th>Phase</th>
                <th>Attribute</th>
                {/* Output List*/}
                <th>Equipment Type</th>
                <th>Name</th>
                <th>Phases</th>
                <th>Measurement Type</th>
                <th>Start Date Time</th>
                <th>Stop Date Time</th>
              </tr>
            </thead>
            <tbody>
              {
                this.state.outageEvents.map((event, i) => (
                  <tr key={i}>
                    <td>
                      <div className='outage-event-summary-table__row-action'>
                        <Tooltip content='Initiate'>
                          <IconButton
                            rounded
                            icon='send'
                            size='small' />
                        </Tooltip>
                        <Tooltip content='Clear'>
                          <IconButton
                            rounded
                            icon='close'
                            style='accent'
                            size='small' />
                        </Tooltip>
                      </div>
                    </td>
                    <td>
                      <div>{this.state.faultMRIDs[i]}</div>
                    </td>
                    <td>
                      <div>{event.tag}</div>
                    </td>
                    {/* Input List */}
                    <td>
                      {event.inputList.map((e, i) => <div key={i}>{e.type}</div>)}
                    </td>
                    <td>
                      {event.inputList.map((e, i) => <div key={i}>{e.name}</div>)}
                    </td>
                    <td>
                      {event.inputList.map((e, i) => <div key={i}>{e.phases.map(e => e.phaseLabel).join(', ')}</div>)}
                    </td>
                    <td>
                      {event.inputList.map((e, i) => <div key={i}>{e.attribute}</div>)}
                    </td>
                    {/* Output List */}
                    <td>
                      {event.outputList.map((e, i) => <div key={i}>{e.type}</div>)}
                    </td>
                    <td>
                      {event.outputList.map((e, i) => <div key={i}>{e.name}</div>)}
                    </td>
                    <td>
                      {event.outputList.map((e, i) => <div key={i}>{e.phases.join(', ')}</div>)}
                    </td>
                    <td>
                      {event.outputList.map((e, i) => <div key={i}>{e.measurementTypes.join(', ')}</div>)}
                    </td>
                    <td>
                      <div>{event.startDateTime}</div>
                    </td>
                    <td>
                      <div>{event.stopDateTime}</div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        }
        {
          this.state.faultEvents.length > 0 &&
          <table className='fault-event-summary-table'>
            <caption>Fault</caption>
            <thead>
              <tr>
                <th>Action</th>
                <th>Fault MRID</th>
                <th>Event Tag</th>
                <th>Equipment Type</th>
                <th>Equipment Name</th>
                <th>Phase</th>
                <th>Fault Kind</th>
                <th>Impedance</th>
                <th>Start Date Time</th>
                <th>Stop Date Time</th>
              </tr>
            </thead>
            <tbody>
              {
                this.state.faultEvents.map((event, i) => (
                  <tr key={i}>
                    <td>
                      <div className='fault-event-summary-table__row-action'>
                        <Tooltip content='Initiate'>
                          <IconButton
                            rounded
                            icon='send'
                            size='small' />
                        </Tooltip>
                        <Tooltip content='Clear'>
                          <IconButton
                            rounded
                            icon='close'
                            style='accent'
                            size='small' />
                        </Tooltip>
                      </div>
                    </td>
                    <td><div>{this.state.faultMRIDs[this.state.outageEvents.length + i]}</div></td>
                    <td><div>{event.tag}</div></td>
                    <td><div>{event.equipmentType}</div></td>
                    <td><div>{event.equipmentName}</div></td>
                    <td><div>{event.phases.map(phase => phase.phaseLabel).join(', ')}</div></td>
                    <td><div>{event.faultKind}</div></td>
                    <td>
                      {
                        Object.entries(event.impedance)
                          .filter(entry => entry[1] !== '')
                          .map(entry => (
                            <div key={entry[0]}><div>{`${entry[0]}: ${entry[1]}`}</div></div>
                          ))
                      }
                    </td>
                    <td><div>{event.startDateTime}</div></td>
                    <td><div>{event.stopDateTime}</div></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        }
      </div>
    );
  }
}