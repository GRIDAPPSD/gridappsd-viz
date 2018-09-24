import * as React from 'react';

export const RequestEditor = ({ children, styles }) => (
  <div className='request-editor' style={...styles}>
    {children}
  </div>
);