import React from 'react';

export const Loader = ({ message = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="d-flex flex-column align-items-center justify-content-center p-4">
      <div className="spinner-border text-primary mb-2" role="status" style={{ width: '2rem', height: '2rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>{message}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}
      >
        {content}
      </div>
    );
  }

  return content;
};
