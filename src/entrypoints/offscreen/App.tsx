import React from 'react';

export const OffscreenApp: React.FC = () => {
  return (
    <div className="offscreen-container">
      <h1>Offscreen Page</h1>
      <p>This page runs in the background and can perform DOM operations.</p>
      <div id="status">Ready to process requests...</div>
    </div>
  );
};
