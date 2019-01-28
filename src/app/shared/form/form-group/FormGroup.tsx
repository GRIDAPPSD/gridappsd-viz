import * as React from 'react';

import './FormGroup.scss';

export const FormGroup = ({ label, children }) => (
  <div className='gridappsd-form-group'>
    <header className='gridappsd-form-group__heading'>{label}</header>
    <div className='gridappsd-form-group__controls'>
      {children}
    </div>
  </div>
);