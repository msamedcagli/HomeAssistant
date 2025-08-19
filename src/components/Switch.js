
import React from 'react';
import './Switch.css';

const Switch = ({ isOn, onToggle }) => {
  return (
    <div className="switch-container">
      <label className="switch">
        <input
          type="checkbox"
          checked={isOn}
          onChange={e => onToggle(e.target.checked)}
        />
        <span className="slider round"></span>
      </label>
    </div>
  );
};

export default Switch;