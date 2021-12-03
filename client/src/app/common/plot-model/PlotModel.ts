import { MeasurementType } from '@client:common/topology';

import { PlotModelComponent } from './PlotModelComponent';

/**
 * PlotModel is an interface used by the PlotCreator component to represent a plot.
 * It holds the data needed to create a new plot when a simulation starts, for example,
 * the plot name, the components in a plot
 */
export interface PlotModel {
  name: string;
  measurementType: MeasurementType;
  components: PlotModelComponent[];
  useMagnitude: boolean;
  useAngle: boolean;
}
