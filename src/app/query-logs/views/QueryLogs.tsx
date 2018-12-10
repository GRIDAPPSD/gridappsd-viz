import * as React from 'react';

import { Dialog } from '../../shared/views/dialog/Dialog';
import { DialogContent } from '../../shared/views/dialog/DialogContent';
import { DialogActions } from '../../shared/views/dialog/DialogActions';
import { BasicButton } from '../../shared/views/buttons/basic-button/BasicButton';
import { Simulation } from '../../models/Simulation';
import { FormControl } from '../../shared/views/form/form-control/FormControl';
import { MenuItem } from '../../shared/views/dropdown-menu/MenuItem';
import { SelectFormControl } from '../../shared/views/form/select-form-control/SelectFormControl';

import './QueryLogs.scss';

interface Props {
  onSubmit: (request) => void;
  onClose: (event) => void;
  response: any;
  simulations: Simulation[];
}

interface State {
  show: boolean;
}

export class QueryLogs extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      show: true
    };
  }

  render() {
    return (
      <Dialog show={this.state.show}>
        <DialogContent>
          <div className='query-logs'>
            <form className='query-logs__request-configuration'>
              <div className='query-logs__request-configuration__left'>
                <FormControl
                  label='Start time'
                  name='startTime'
                  value=''
                  onChange={console.log} />
                <SelectFormControl
                  label='Simulation ID'
                  menuItems={
                    this.props.simulations.map(simulation => new MenuItem(`${simulation.name} - ${simulation.id}`, simulation.id))
                  }
                  defaultSelectedIndex={0}
                  onChange={console.log} />
                <FormControl
                  label='Username'
                  name='username'
                  value='system'
                  onChange={console.log} />
              </div>
              <div className='query-logs__request-configuration__right'>
                <SelectFormControl
                  label='Source'
                  multiple
                  menuItems={[
                    new MenuItem('Source 1', 'Source 1'),
                    new MenuItem('Source 2', 'Source 2')
                  ]}
                  defaultSelectedIndex={0}
                  onChange={console.log} />
                <SelectFormControl
                  label='Log level'
                  menuItems={
                    ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'].map(e => new MenuItem(e, e))
                  }
                  defaultSelectedIndex={1}
                  onChange={console.log} />
                <SelectFormControl
                  label='Process status'
                  menuItems={
                    ['ALL', 'STARTING', 'STARTED', 'RUNNING', 'ERROR', 'CLOSED', 'COMPLETE'].map(e => new MenuItem(e, e))
                  }
                  defaultSelectedIndex={0}
                  onChange={console.log} />

              </div>
            </form>
            <div className='query-logs__response'>

            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <BasicButton
            label='Cancel'
            type='negative'
            onClick={event => {
              event.stopPropagation();
              this.setState({ show: false });
              this.props.onClose(event);
            }} />
          <BasicButton
            label='Submit'
            type='positive'
            onClick={event => {
              event.stopPropagation();
              this.props.onSubmit('WOW');
            }} />
        </DialogActions>
      </Dialog>
    );
  }
}