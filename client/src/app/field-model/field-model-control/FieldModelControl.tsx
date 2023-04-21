import { Component } from 'react';

import { IconButton } from '@client:common/buttons';
import { Tooltip } from '@client:common/tooltip';
import { PlotModel } from '@client:common/plot-model/PlotModel';
import { ModelDictionaryComponent } from '@client:common/topology';
import { PortalRenderer } from '@client:common/overlay/portal-renderer';
import { Restricted } from '@client:common/authenticator';
import { FieldModelOutputStatus } from '@project:common/FieldModelOutputStatus';

import { PlotModelCreator } from '../../simulation/simulation-control/views/plot-model-creator/PlotModelCreator';

import './FieldModelControl.light.scss';
import './FieldModelControl.dark.scss';

interface Props {
    fieldModelOutputStatus: FieldModelOutputStatus;
    existingPlotModels: PlotModel[];
    modelDictionaryComponents: ModelDictionaryComponent[];
    fieldModelMrid: string;
    onStartFieldModelOutput: () => void;
    onStopFieldModelOutput: () => void;
    onPlotModelCreationDone: (plotModels: PlotModel[]) => void;
}

interface State {}

export class FieldModelControl extends Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {};
        this.showPlotModelCreator = this.showPlotModelCreator.bind(this);
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        if (prevProps.modelDictionaryComponents !== this.props.modelDictionaryComponents) {
            if (this.props.modelDictionaryComponents.length !== 0) {
                this.props.onStartFieldModelOutput();
            }
        }
    }

    render() {
        return (
            <div className='simulation-control'>
                <Restricted roles={['testmanager']}>
                    {this.showFieldModelControlButtons()}
                    <Tooltip content='Edit plots'>
                        <IconButton
                            icon='show_chart'
                            className='simulation-control__action add-component-to-plot'
                            disabled={this.props.modelDictionaryComponents.length === 0}
                            onClick={this.showPlotModelCreator} />
                    </Tooltip>
                </Restricted>
            </div>
        );
    }

    showFieldModelControlButtons() {
        switch (this.props.fieldModelOutputStatus) {
            case FieldModelOutputStatus.STARTING:
                return null;
            case FieldModelOutputStatus.STARTED:
                return (
                    <>
                        <Tooltip content='Stop field model'>
                            <IconButton
                                icon='stop'
                                className='simulation-control__action'
                                onClick={this.props.onStopFieldModelOutput} />
                        </Tooltip>
                    </>
                );
            default:
                // * Hide the Start Btn for Field Model Output
                return null;
        }
    }

    showPlotModelCreator() {
        const portalRenderer = new PortalRenderer();
        portalRenderer.mount(
            <PlotModelCreator
                modelDictionaryComponents={this.props.modelDictionaryComponents}
                existingPlotModels={this.props.existingPlotModels}
                onSubmit={this.props.onPlotModelCreationDone}
                onClose={portalRenderer.unmount} />
        );
    }

}
