import * as React from 'react';

import { Option } from './Option';

import './OptionList.light.scss';
import './OptionList.dark.scss';

interface Props<T> {
  options: Option<T>[];
  onSelectOption: (option: Option<T>) => void;
}

export function OptionList<T>(props: Props<T>) {
  return (
    <ul className='option-list'>
      {
        props.options.map((option, index) =>
          <li
            key={index}
            className={`option-list__option${option.isSelected ? ' selected' : ''}`}
            onClick={() => props.onSelectOption(option)}>
            <span className='option-list__option__label'>{option.label}</span>
          </li>
        )
      }
    </ul>
  );
}
