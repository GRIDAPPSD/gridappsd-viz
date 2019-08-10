import * as React from 'react';

export function RequestEditor({ children, styles = {} }) {
  return (
    <div className='request-editor' style={{ ...styles }}>
      {children}
    </div>
  );
}
