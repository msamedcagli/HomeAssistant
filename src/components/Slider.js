import React, { useState } from 'react';
import './Slider.css';

const Slider = ({ label, min = 0, max = 100, initialValue = 50, color = '#03a9f4' }) => {
  const [value, setValue] = useState(initialValue);

  const sliderStyle = {
    background: `linear-gradient(90deg, ${color} ${value / max * 100}%, rgba(0,0,0,0.3) ${value / max * 100}%)`
  };

  return (
    <div className="slider-container">
      <label htmlFor={label}>{label}: {value}</label>
      <input
        type="range"
        id={label}
        min={min}
        max={max}
        value={value}
        className="slider-input"
        onChange={(e) => setValue(e.target.value)}
        style={sliderStyle}
      />
    </div>
  );
};

export default Slider;