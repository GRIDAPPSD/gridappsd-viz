import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { FieldModel } from './FieldModel';
import { DEFAULT_FIELD_MODEL_CONFIGURATION } from './default-field-model-configuration';

export class FieldModelQueue {

    private static readonly _INSTANCE_ = new FieldModelQueue();

    private readonly _activeFieldModelChangeSubject = new BehaviorSubject<FieldModel>(null);
    private readonly _queueChangeSubject = new Subject<FieldModel[]>();

    private _fieldModels: FieldModel[] = [];
    private _activeFieldModel: FieldModel = new FieldModel(DEFAULT_FIELD_MODEL_CONFIGURATION);

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {
    }

    static getInstance() {
        return FieldModelQueue._INSTANCE_;
    }

    activeFieldModelChanged(): Observable<FieldModel> {
        return this._activeFieldModelChangeSubject.asObservable()
            .pipe(filter(simulation => simulation !== null));
    }

    getActiveFieldModel(): FieldModel {
        return this._activeFieldModel;
    }

    getAllFieldModels(): FieldModel[] {
        return this._fieldModels;
    }

    push(newSimulation: FieldModel) {
        this._fieldModels.unshift(newSimulation);
        this._activeFieldModel = newSimulation;
        this._activeFieldModelChangeSubject.next(newSimulation);
        this._queueChangeSubject.next(this._fieldModels);
    }

    queueChanges(): Observable<FieldModel[]> {
        return this._queueChangeSubject.asObservable();
    }

    updateIdOfActiveFieldModel(id: string) {
        this._activeFieldModel.id = id;
        this._queueChangeSubject.next(this._fieldModels);
    }

}
