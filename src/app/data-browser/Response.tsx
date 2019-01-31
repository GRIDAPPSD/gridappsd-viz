import * as React from 'react';

export const Response = ({ children, styles = {} }) => (
  <div className='response' style={{ ...styles }}>
    {children}
  </div>
);