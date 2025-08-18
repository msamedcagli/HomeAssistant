
import React, { useState } from 'react';
import './Switch.css';

const Switch = ({ label }) => {
  const [isOn, setIsOn] = useState(false);

  const toggleSwitch = () => {
    setIsOn(!isOn);
  };

  return (
    <div className="switch-container">
      <span>{label}</span>
      <label className="switch">
        <input type="checkbox" checked={isOn} onChange={toggleSwitch} />
        <span className="slider round"></span>
      </label>
    </div>
  );
};

export default Switch;
