import React, { useState, useEffect } from 'react';
import { getItems, sendCommand, getItemState } from './openhabApi';
import Card from './components/Card';
import Switch from './components/Switch';
import Slider from './components/Slider';
import './OpenHABPanel.css';

const OpenHABPanel = () => {
    const [items, setItems] = useState([]);
    const [currentColor, setCurrentColor] = useState('#000000');
    const [error, setError] = useState(null);

    const fetchItems = () => {
        getItems()
            .then(response => {
                // Display only items that can be controlled with ON/OFF commands
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
        // Optional: refresh items every 5 seconds
        const interval = setInterval(fetchItems, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const colorItemName = 'Generic_MQTT_Thing_RGB_Light_RGB_Light_Color';

        const fetchColor = () => {
            getItemState(colorItemName)
                .then(response => {
                    const state = response.data;
                    if (typeof state === 'string') {
                        const parts = state.split(',');
                        if (parts.length === 3) {
                            // If HSB, convert to RGB
                            let h = parseInt(parts[0]);
                            let s = parseInt(parts[1]);
                            let v = parseInt(parts[2]);
                            if (!isNaN(h) && !isNaN(s) && !isNaN(v)) {
                                h = h / 360;
                                s = s / 100;
                                v = v / 100;
                                let r = 0, g = 0, b = 0;
                                let i = Math.floor(h * 6);
                                let f = h * 6 - i;
                                let p = v * (1 - s);
                                let q = v * (1 - f * s);
                                let t = v * (1 - (1 - f) * s);
                                switch (i % 6) {
                                    case 0: r = v; g = t; b = p; break;
                                    case 1: r = q; g = v; b = p; break;
                                    case 2: r = p; g = v; b = t; break;
                                    case 3: r = p; g = q; b = v; break;
                                    case 4: r = t; g = p; b = v; break;
                                    case 5: r = v; g = p; b = q; break;
                                }
                                r = Math.round(r * 255);
                                g = Math.round(g * 255);
                                b = Math.round(b * 255);
                                const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
                                setCurrentColor(hex);
                            } else {
                                // Try to parse as RGB
                                const rgbArr = parts.map(x => parseInt(x));
                                if (rgbArr.every(x => !isNaN(x))) {
                                    const hex = '#' + rgbArr.map(x => x.toString(16).padStart(2, '0')).join('');
                                    setCurrentColor(hex);
                                }
                            }
                        }
                    }
                })
                .catch(err => {
                    console.error(`Error fetching state for ${colorItemName}:`, err);
                });
        };

        fetchColor(); // Fetch color on component mount
        const interval = setInterval(fetchColor, 1000); // Fetch color every second

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, []); // Empty dependency array ensures this runs only once on mount

    const handleCommand = (itemName, command) => {
        sendCommand(itemName, command)
            .then(() => {
                // After sending a command, refresh the items state with a short delay
                setTimeout(fetchItems, 200); // Reduced delay for faster response
            })
            .catch(err => {
                console.error(`Error sending command to ${itemName}:`, err);
                setError(`Failed to send command to ${itemName}.`);
            });
    };

    // Brightness slider command (no debounce)
    const handleBrightnessChange = (itemName, value) => {
        handleCommand(itemName, value);
    };

    if (error) {
        return <div className="panel-error">{error}</div>;
    }

    return (
            <div className="openhab-panel">
                <h2>Home Assistant Panel</h2>
                <div className="items-grid">
                    {/* RGB LED Card */}
                    <Card title="RGB Led Ayarları">
                        <div style={{display: 'flex', flexDirection: 'column', gap: '1px', alignItems: 'center', marginTop: '1px', height: 'fit-content'}}>
                            {/* RGB LED Power Switch */}
                            {items.filter(item => item.label?.toLowerCase().includes('rgb') && item.type === 'Switch').map(item => (
                                <div key={item.name} style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '4px 10px'}}>
                                    <span style={{fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '12px'}}>RGB LED On/Off</span>
                                    <Switch
                                        isOn={item.state === 'ON'}
                                        onToggle={(isOn) => handleCommand(item.name, isOn ? 'ON' : 'OFF')}
                                    />
                                </div>
                            ))}
                            {/* Color Picker */}
                        <div style={{margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center'}}>
                            <label style={{color: '#fff', fontWeight: 'bold', marginBottom: '3px', display: 'block'}}>Renk Ayarı</label>
                            <input
                                type="color"
                                value={currentColor}
                                style={{width: '48px', height: '48px', border: 'none', background: 'none', cursor: 'pointer'}}
                                onChange={e => {
                                    const hex = e.target.value;
                                    // Hex to RGB
                                    const r = parseInt(hex.slice(1, 3), 16);
                                    const g = parseInt(hex.slice(3, 5), 16);
                                    const b = parseInt(hex.slice(5, 7), 16);
                                    // RGB to HSB
                                    const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
                                    const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
                                    let h = 0, s = 0, v = max;
                                    const d = max - min;
                                    s = max === 0 ? 0 : d / max;
                                    if (max === min) {
                                        h = 0;
                                    } else {
                                        switch (max) {
                                            case rNorm:
                                                h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
                                                break;
                                            case gNorm:
                                                h = (bNorm - rNorm) / d + 2;
                                                break;
                                            case bNorm:
                                                h = (rNorm - gNorm) / d + 4;
                                                break;
                                        }
                                        h /= 6;
                                    }
                                    // Convert to OpenHAB format
                                    const H = Math.round(h * 360);
                                    const S = Math.round(s * 100);
                                    const B = Math.round(v * 100);
                                    const hsbString = `${H},${S},${B}`;
                                    handleCommand('Generic_MQTT_Thing_RGB_Light_RGB_Light_Color', hsbString);
                                }}
                            />
                        </div>
                            {/* RGB renk sliderları */}
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
                            {/* RGB Brightness sliderı */}
                            {items.filter(item => item.label === 'Generic MQTT Thing RGB Light RGB Light Brightness' || item.label?.toLowerCase().includes('brightness')).map(item => {
                                // Eğer item.state bir obje ise, parlaklık değerini al
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
                    {/* Röle Card */}
                    <Card title="Röle Kontrolü">
                    <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                        {/* Röle 1 */}
                        {items.filter(item => item.label?.includes('Röle 1') || item.name?.includes('Role1')).map(item => (
                            <div key={item.name} style={{display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '12px'}}>
                                <span style={{fontWeight: 'bold', minWidth: '70px', textAlign: 'left'}}>Röle 1</span>
                                <Switch
                                    isOn={item.state === 'ON'}
                                    onToggle={(isOn) => handleCommand(item.name, isOn ? 'ON' : 'OFF')}
                                />
                            </div>
                        ))}
                        {/* Röle 2 */}
                        {items.filter(item => item.label?.includes('Röle 2') || item.name?.includes('Role2')).map(item => (
                            <div key={item.name} style={{display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '12px'}}>
                                <span style={{fontWeight: 'bold', minWidth: '70px', textAlign: 'left'}}>Röle 2</span>
                                <Switch
                                    isOn={item.state === 'ON'}
                                    onToggle={(isOn) => handleCommand(item.name, isOn ? 'ON' : 'OFF')}
                                />
                            </div>
                        ))}
                    </div>
                </Card>
                    {/* Sensörler Card */}
                    <Card title="Sensörler">
                        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                            {items.filter(item => item.label?.toLowerCase().includes('hareket') || item.name?.toLowerCase().includes('motion')).map(item => {
                                // Hareket sensörü için state'i açık/kapalı olarak göster ve hizalı olsun
                                let stateText = 'Kapalı';
                                let stateClass = 'state-closed';
                                if (item.state === 'ON' || item.state === 'OPEN' || item.state === true) {
                                    stateText = 'Açık';
                                    stateClass = 'state-open';
                                }
                                return (
                                    <div key={item.name} style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px'}}>
                                        <span>{item.label === 'Generic MQTT Thing Motion Sensor Motion Sensor' ? 'Hareket Sensörü' : (item.label || item.name)}</span>
                                        <span className={`item-state ${stateClass}`}>{stateText}</span>
                                    </div>
                                );
                            })}
                            {items.filter(item => {
                                // Kapı sensörü için daha geniş bir filtre
                                const label = item.label?.toLowerCase() || '';
                                const name = item.name?.toLowerCase() || '';
                                return (
                                    label.includes('kapı') ||
                                    label.includes('door') ||
                                    name.includes('kapı') ||
                                    name.includes('door') ||
                                    (label.includes('sensor') && label.includes('door'))
                                );
                            }).map(item => {
                                // Kapı sensörü için state'i OPEN/CLOSED olarak göster
                                let stateText = 'CLOSED';
                                let stateClass = 'state-closed';
                                if (item.state === 'OPEN' || item.state === 'ON' || item.state === true) {
                                    stateText = 'OPEN';
                                    stateClass = 'state-open';
                                }
                                return (
                                    <div key={item.name} style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px'}}>
                                        <span>{item.label === 'Generic MQTT Thing Door Sensor Door Sensor' ? 'Kapı Sensörü' : (item.label || item.name)}</span>
                                        <span className={`item-state ${stateClass}`}>{stateText}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                    {/* Diğer itemlar (Röle ve sensör harici) */}
                    {items.filter(item => {
                        const isRole = item.label?.includes('Röle 1') || item.label?.includes('Röle 2') || item.name?.includes('Role1') || item.name?.includes('Role2');
                        const isSensor = item.label?.toLowerCase().includes('hareket') || item.label?.toLowerCase().includes('kapı') || item.name?.toLowerCase().includes('motion') || item.name?.toLowerCase().includes('door');
                        const isGeneric = item.label === 'Generic MQTT Thing roleOnOff' || item.name === 'Generic MQTT Thing roleOnOff' || item.label === 'Generic MQTT Thing On/Off' || item.name === 'Generic MQTT Thing On/Off';
                        const isBrightness = item.label === 'Generic MQTT Thing RGB Light RGB Light Brightness' || item.label?.toLowerCase().includes('brightness');
                        const isRgbPower = item.label === 'Generic MQTT Thing RGB Light RGB Light Power' || item.label?.toLowerCase().includes('power');
                        return !isRole && !isSensor && !isGeneric && !isBrightness && !isRgbPower;
                    }).map(item => (
                        <Card key={item.name} title={item.label || item.name}>
                            <span className="item-state">Durum: {item.state}</span>
                            <div className="item-controls">
                                <Switch
                                    isOn={item.state === 'ON'}
                                    onToggle={(isOn) => handleCommand(item.name, isOn ? 'ON' : 'OFF')}
                                />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
    );
};

export default OpenHABPanel;