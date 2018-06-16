import { MRID } from '../../models/MRID';
import { StoreMRIDs, STORE_MRIDS } from './simulation-config-form-actions';

export function mRIDs(state: MRID[] = [], action: StoreMRIDs): MRID[] {
  switch (action.type) {
    case STORE_MRIDS:
      return action.mRIDs;
    default:
      return state;
  }
}