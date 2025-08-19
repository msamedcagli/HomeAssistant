import React from 'react';
import './Slider.css';

const Slider = ({ label, min = 0, max = 100, value = 50, color = '#03a9f4', onChange, showValue = true }) => {
  const sliderStyle = {
    background: `linear-gradient(90deg, ${color} ${value / max * 100}%, rgba(0,0,0,0.3) ${value / max * 100}%)`
  };

  return (
    <div className="slider-container">
      <label htmlFor={label}>{label}{showValue ? `: ${Math.round(value)}` : ''}</label>
      <input
        type="range"
        id={label}
        min={min}
        max={max}
        value={value}
        className="slider-input"
        onChange={(e) => onChange(Number(e.target.value))}
        style={sliderStyle}
      />
    </div>
  );
};

export default Slider;