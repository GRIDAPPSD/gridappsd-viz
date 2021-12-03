import { Option } from './Option';

import './OptionList.light.scss';
import './OptionList.dark.scss';

interface Props<T> {
  options: Option<T>[];
  onSelectOption: (option: Option<T>) => void;
}

export function OptionList<T>(props: Props<T>) {
  return (
    <ul
      className='option-list'
      onClick={(event: React.MouseEvent) => {
        const clickedOptionIndex = +(event.target as HTMLElement).dataset.index;
        props.onSelectOption(props.options[clickedOptionIndex]);
      }}>
      {
        props.options.map((option, index) =>
          <li
            key={index}
            data-index={index}
            className={`option-list__option${option.isSelected ? ' selected' : ''}`}>
            <span className='option-list__option__label'>
              {option.label}
            </span>
          </li>
        )
      }
    </ul>
  );
}
