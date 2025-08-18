
import React from 'react';
import './App.css';
import Card from './components/Card';
import Switch from './components/Switch';
import Slider from './components/Slider';
import SensorDisplay from './components/SensorDisplay';
import RGBCardCarousel from './components/RGBCardCarousel';

function App() {
  return (
    <div className="app">
      <h1>Akıllı Ev Paneli</h1>

      <div className="grid-container">
        <RGBCardCarousel />

        <Card title="Röle Kontrolü">
          <Switch label="Role Switch 1" />
          <Switch label="Role Switch 2" />
        </Card>

        <Card title="Sensörler">
          <SensorDisplay label="Hareket Sensörü" value="ON" state="on" />
          <SensorDisplay label="Kapı Sensörü" value="CLOSED" state="closed" />
        </Card>
      </div>

    </div>
  );
}

export default App;
