const mqtt = require('mqtt');
require('dotenv').config();

const brokerUrl = 'mqtts://q5117576.ala.asia-southeast1.emqxsl.com:8883';
const options = {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: 'test_client_' + Math.random().toString(16).slice(2),
    connectTimeout: 5000,
    rejectUnauthorized: false 
};

console.log('Testing connection to:', brokerUrl);
const client = mqtt.connect(brokerUrl, options);

client.on('connect', () => {
    console.log('✅ Connected successfully!');
    client.end();
    process.exit(0);
});

client.on('error', (err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('❌ Timeout reached');
    process.exit(1);
}, 10000);
