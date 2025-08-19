// ...existing code...
import axios from 'axios';

const API_URL = '/rest';

// Fetches all items from the OpenHAB API
export const getItems = () => {
    return axios.get(`${API_URL}/items`);
};

// Fetches the state of a specific item
export const getItemState = (itemName) => {
    return axios.get(`${API_URL}/items/${itemName}/state`);
};

// Sends a command to a specific item
export const sendCommand = (itemName, command) => {
    return axios.post(`${API_URL}/items/${itemName}`, command, {
        headers: {
            'Content-Type': 'text/plain'
        }
    });
};