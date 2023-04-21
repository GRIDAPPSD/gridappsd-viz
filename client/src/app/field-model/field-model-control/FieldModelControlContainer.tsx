import { Component } from 'react';
import { Subject } from 'rxjs';
import { filter, takeUntil, switchMap, tap } from 'rxjs/operators';

import { FieldModelManagementService } from '@client:common/field-model-datastream';
import { StateStore } from '@client:common/state-store';
import { ModelDictionaryComponent } from '@client:common/topology';
import { PlotModel } from '@client:common/plot-model/PlotModel';
import { FieldModelOutputStatus } from '@project:common/FieldModelOutputStatus';

import { FieldModelControl } from './FieldModelControl';

interface Props {
    fieldModelMrid: string;
}

interface State {
    fieldModelOutputStatus: FieldModelOutputStatus;
    activeFieldModelId: string;
    existingPlotModels: PlotModel[];
    modelDictionaryComponents: ModelDictionaryComponent[];
}

export class FieldModelControlContainer extends Component<Props, State> {

    readonly fieldModelManagementService = FieldModelManagementService.getInstance();

    private readonly _stateStore = StateStore.getInstance();
    private readonly _unsubscriber = new Subject<void>();

    constructor(props: Props) {
        super(props);

        this.state = {
            fieldModelOutputStatus: this.fieldModelManagementService.currentFieldModelOutputStatus(),
            activeFieldModelId: '',
            existingPlotModels: [],
            modelDictionaryComponents: []
        };

        this.updatePlotModels = this.updatePlotModels.bind(this);
    }

    componentDidMount() {
        this._stopFieldModelOutputWhenRedirect();
        this._subscribeToFieldModelOutputStatusChanges();
        this._subscribeToPlotModelsStateChanges();
        this._subscribeToComponentsWithConsolidatedPhasesStateChanges();
        this._subscribeToFieldModelIdChanges();
    }

    private _stopFieldModelOutputWhenRedirect() {
        if (this.props.fieldModelMrid && this.props.fieldModelMrid !== '') {
            this.fieldModelManagementService.stopFieldModelOutput();
            this.setState({
                fieldModelOutputStatus: FieldModelOutputStatus.STOPPED
            });
        }
    }

    private _subscribeToFieldModelOutputStatusChanges() {
        this.fieldModelManagementService.fieldModelOutputStatusChanges()
            .pipe(
                tap(status => {
                    if (this.fieldModelManagementService.isUserInActiveFieldModelOutput()) {
                        this.setState({
                            fieldModelOutputStatus: status
                        });
                    }
                }),
                filter(status => status === FieldModelOutputStatus.STARTING),
                switchMap(() => this._stateStore.select('simulationId')),
                filter(Id => Id !== ''),
                takeUntil(this._unsubscriber)
            )
            .subscribe({
                next: Id => {
                    this.setState({
                        activeFieldModelId: Id
                    });
                }
            });
    }

    private _subscribeToPlotModelsStateChanges() {
        this._stateStore.select('plotModels')
            .pipe(takeUntil(this._unsubscriber))
            .subscribe({
                next: plotModels => this.setState({ existingPlotModels: plotModels })
            });
    }

    private _subscribeToComponentsWithConsolidatedPhasesStateChanges() {
        this._stateStore.select('modelDictionaryComponents')
            .pipe(takeUntil(this._unsubscriber))
            .subscribe({
                next: components => this.setState({ modelDictionaryComponents: components })
            });
    }

    private _subscribeToFieldModelIdChanges() {
        this._stateStore.select('simulationId')
            .pipe(takeUntil(this._unsubscriber))
            .subscribe({
                next: id => this.setState({ activeFieldModelId: id })
            });
    }

    componentWillUnmount() {
        this._unsubscriber.next();
        this._unsubscriber.complete();
    }

    render() {
        return (
            <FieldModelControl
                fieldModelMrid={this.props.fieldModelMrid}
                fieldModelOutputStatus={this.state.fieldModelOutputStatus}
                existingPlotModels={this.state.existingPlotModels}
                onStartFieldModelOutput={this.fieldModelManagementService.startFieldModelOutput}
                modelDictionaryComponents={this.state.modelDictionaryComponents}
                onStopFieldModelOutput={this.fieldModelManagementService.stopFieldModelOutput}
                onPlotModelCreationDone={this.updatePlotModels} />
        );
    }

    updatePlotModels(plotModels: PlotModel[]) {
        this._stateStore.update({
            plotModels
        });
    }

}
