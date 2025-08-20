
import React, { useState, useEffect } from 'react';
import { getItems, sendCommand } from './openhabApi';
import Card from './components/Card';
import Switch from './components/Switch';
import Slider from './components/Slider';
import './OpenHABPanel.css';

const OpenHABPanel = () => {
    const [items, setItems] = useState([]);
    const [error, setError] = useState(null);

    const fetchItems = () => {
        getItems()
            .then(response => {
                const controllableItems = response.data.filter(item =>
                    item.type === 'Switch' || item.type === 'Dimmer' || item.type === 'Contact'
                );
                setItems(controllableItems);
            })
            .catch(err => {
                console.error("Error fetching items:", err);
                setError("Could not fetch items. Is OpenHAB running and the proxy configured correctly?");
            });
    };

    useEffect(() => {
        fetchItems();
        const interval = setInterval(fetchItems, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCommand = (itemName, command) => {
        sendCommand(itemName, command)
            .then(() => {
                setTimeout(fetchItems, 200);
            })
            .catch(err => {
                console.error(`Error sending command to ${itemName}:`, err);
                setError(`Failed to send command to ${itemName}.`);
            });
    };

    const handleBrightnessChange = (itemName, value) => {
        handleCommand(itemName, value);
    };

    const handleColorChange = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
        const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
        let h = 0, s = 0, v = max;
        const d = max - min;
        s = max === 0 ? 0 : d / max;
        if (max !== min) {
            switch (max) {
                case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
                case gNorm: h = (bNorm - rNorm) / d + 2; break;
                case bNorm: h = (rNorm - gNorm) / d + 4; break;
                default: h = 0;
            }
            h /= 6;
        }
        const H = Math.round(h * 360);
        const S = Math.round(s * 100);
        const B = Math.round(v * 100);
        const hsbString = `${H},${S},${B}`;
        handleCommand('Generic_MQTT_Thing_RGB_Light_RGB_Light_Color', hsbString);
    };

    if (error) {
        return <div className="panel-error">{error}</div>;
    }

    return (
        <div className="panel-container">
            <h1 className="main-title">Home Asistant Panel</h1>
            <div className="main-grid">
                <div className="card-row">
                    <Card title="RGB Led Ayarları">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {items.filter(item => item.label === 'Generic MQTT Thing RGB Light RGB Light Power' || item.label?.toLowerCase().includes('power')).map(item => (
                                    <React.Fragment key={item.name}>
                                        <Switch
                                            isOn={item.state === 'ON'}
                                            onToggle={(isOn) => handleCommand(item.name, isOn ? 'ON' : 'OFF')}
                                        />
                                        <span style={{color: 'white'}}>{item.state === 'ON' ? 'Açık' : 'Kapalı'}</span>
                                    </React.Fragment>
                                ))}
                            </div>
                            <input
                                type="color"
                                style={{ width: '100px', height: '40px', border: 'none', background: 'none', cursor: 'pointer' }}
                                onChange={e => handleColorChange(e.target.value)}
                            />
                            {items.filter(item => item.label?.toLowerCase().includes('rgb') && item.type === 'Dimmer' && !item.label?.toLowerCase().includes('brightness')).map(item => (
                                <Slider
                                    key={item.name}
                                    label={item.label || item.name}
                                    min={0}
                                    max={255}
                                    value={parseFloat(item.state) || 0}
                                    color={item.label?.toLowerCase().includes('kırmızı') ? '#ff4d4d' : item.label?.toLowerCase().includes('yeşil') ? '#4dff4d' : item.label?.toLowerCase().includes('mavi') ? '#4d4dff' : '#03a9f4'}
                                    onChange={value => handleCommand(item.name, value)}
                                />
                            ))}
                            {items.filter(item => item.label === 'Generic MQTT Thing RGB Light RGB Light Brightness' || item.label?.toLowerCase().includes('brightness')).map(item => {
                                let brightnessValue = 0;
                                if (typeof item.state === 'object' && item.state !== null && 'brightness' in item.state) {
                                    brightnessValue = item.state.brightness;
                                } else {
                                    brightnessValue = parseFloat(item.state) || 0;
                                }
                                return (
                                    <Slider
                                        key={item.name}
                                        label={'Parlaklık'}
                                        min={0}
                                        max={100}
                                        value={Math.min(brightnessValue, 100)}
                                        color={'#ffd700'}
                                        showValue={false}
                                        onChange={value => handleBrightnessChange(item.name, value)}
                                    />
                                );
                            })}
                        </div>
                    </Card>
                    <Card className="camera-card">
                        <div className="camera-view">
                            <iframe
                                src="http://192.168.1.162:1984/stream.html?src=hikvision_main"
                                title="Hikvision Kamera"
                                style={{ border: 'none', borderRadius: '16px', background: '#222', boxShadow: '0 2px 16px rgba(0,0,0,0.25)' }}
                                allowFullScreen
                            />
                            <div className="camera-fallback">
                                Görüntü gelmiyorsa bağlantı veya tarayıcı desteğini kontrol edin.
                            </div>
                        </div>
                    </Card>
                </div>
                <div className="card-row">
                    <Card title="Röle Kontrolü">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {items.filter(item => item.label?.includes('Röle 1') || item.name?.includes('Role1')).map(item => (
                                <div key={item.name} style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontWeight: 'bold', minWidth: '70px', textAlign: 'left' }}>Röle 1</span>
                                    <Switch
                                        isOn={item.state === 'ON'}
                                        onToggle={(isOn) => handleCommand(item.name, isOn ? 'ON' : 'OFF')}
                                    />
                                </div>
                            ))}
                            {items.filter(item => item.label?.includes('Röle 2') || item.name?.includes('Role2')).map(item => (
                                <div key={item.name} style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontWeight: 'bold', minWidth: '70px', textAlign: 'left' }}>Röle 2</span>
                                    <Switch
                                        isOn={item.state === 'ON'}
                                        onToggle={(isOn) => handleCommand(item.name, isOn ? 'ON' : 'OFF')}
                                    />
                                </div>
                            ))}
                        </div>
                    </Card>
                    <Card title="Sensörler">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {items.filter(item => item.label?.toLowerCase().includes('hareket') || item.name?.toLowerCase().includes('motion')).map(item => {
                                let stateText = 'Hareket Yok';
                                let stateClass = 'state-closed';
                                if (item.state === 'ON' || item.state === 'OPEN' || item.state === true) {
                                    stateText = 'Hareket Var';
                                    stateClass = 'state-open';
                                }
                                return (
                                    <div key={item.name} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                                        <span>{item.label === 'Generic MQTT Thing Motion Sensor Motion Sensor' ? 'Hareket Sensörü' : (item.label || item.name)}</span>
                                        <span className={`item-state ${stateClass}`}>{stateText}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
                
            </div>
        </div>
    );
};

export default OpenHABPanel;
