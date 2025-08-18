import React from 'react';
import './RGBCardCarousel.css';
import Switch from './Switch';
import Slider from './Slider';

const RGBCardCarousel = () => {
  return (
    <div className="card rgb-carousel">
      <div className="carousel-wrapper">
        <div className="carousel-page">
          <h2 className="card-title">RGB Led On/Off</h2>
          <div className="card-content">
            <Switch label="Ana Işık" />
            <Slider label="Parlaklık" initialValue={80} />
          </div>
        </div>
        <div className="carousel-page">
          <h2 className="card-title">RGB Led Renk Ayarı</h2>
          <div className="card-content">
            <Slider label="Kırmızı" max={255} initialValue={240} color="#ff4d4d" />
            <Slider label="Yeşil" max={255} initialValue={100} color="#4dff4d" />
            <Slider label="Mavi" max={255} initialValue={180} color="#4d4dff" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RGBCardCarousel;
