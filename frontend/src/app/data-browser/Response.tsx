import * as React from 'react';

export function Response({ children, styles = {} }) {
  return (
    <div className='response' style={{ ...styles }}>
      {children}
    </div>
  );
}
