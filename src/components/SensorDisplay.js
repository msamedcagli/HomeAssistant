
import React from 'react';
import './SensorDisplay.css';

const SensorDisplay = ({ label, value, state }) => {
  const stateClass = state ? `state-${state.toLowerCase()}` : '';
  return (
    <div className="sensor-display">
      <span className="sensor-label">{label}</span>
      <span className={`sensor-value ${stateClass}`}>{value}</span>
    </div>
  );
};

export default SensorDisplay;
