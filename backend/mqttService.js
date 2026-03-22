const mqtt = require('mqtt');
const supabase = require('./supabase');

// 1. MQTT Connection to HiveMQ Cloud
// Ensure you set these in your backend `.env` file!
const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtts://cb000c23aae44005a66f846d40e3f716.s1.eu.hivemq.cloud:8883';
const options = {
    username: process.env.MQTT_USERNAME || 'esp32',
    password: process.env.MQTT_PASSWORD || 'Pratham@123',
    clientId: `agrismart_backend_${Math.random().toString(16).slice(2)}`,
    rejectUnauthorized: true, // Secure SSL Port 8883 requirement
};

const client = mqtt.connect(brokerUrl, options);

client.on('connect', () => {
    console.log('✅ Connected to HiveMQ Cloud');
});

client.on('error', (err) => {
    console.error('❌ MQTT Connection Error:', err);
});

// 2. Telemetry Processing Engine
const processSensorData = async () => {
    try {
        // Fetch the oldest unprocessed row
        const { data, error } = await supabase
            .from('sensor_data')
            .select('*')
            .eq('processed', false)
            .order('created_at', { ascending: true })
            .limit(1);

        if (error) throw error;
        if (!data || data.length === 0) return;

        const row = data[0];
        
        // Averages calculation safely avoiding NaN
        const s1 = row.soil1 || 0;
        const s2 = row.soil2 || 0;
        const s3 = row.soil3 || 0;
        const s4 = row.soil4 || 0;
        
        const avg1 = (s1 + s2) / 2;
        const avg2 = (s3 + s4) / 2;
        const temp = row.temperature || 0;

        let pump1 = row.irrigation1 || false;
        let pump2 = row.irrigation2 || false;

        const mode1 = row.irrigation_mode1 || 'auto';
        const mode2 = row.irrigation_mode2 || 'auto';

        // Auto Logic - Zone 1
        if (mode1 === 'auto') {
            if (avg1 > 70) pump1 = false; // FORCE OFF
            else if (avg1 > 60) pump1 = false;
            else if (avg1 < 35) pump1 = true;
            else if (temp > 28 && avg1 < 45) pump1 = true;
            else if (temp < 15 && avg1 < 45) pump1 = false;
        }

        // Auto Logic - Zone 2
        if (mode2 === 'auto') {
            if (avg2 > 70) pump2 = false; // FORCE OFF
            else if (avg2 > 60) pump2 = false;
            else if (avg2 < 35) pump2 = true;
            else if (temp > 28 && avg2 < 45) pump2 = true;
            else if (temp < 15 && avg2 < 45) pump2 = false;
        }

        // Update Supabase row marking it as processed
        const { error: updateError } = await supabase
            .from('sensor_data')
            .update({
                irrigation1: pump1,
                irrigation2: pump2,
                processed: true
            })
            .eq('id', row.id);

        if (updateError) throw updateError;

        // Publish to HiveMQ
        const payload = {
            pump1: pump1,
            pump2: pump2,
            mode1: mode1,
            mode2: mode2,
            timestamp: new Date().toISOString()
        };

        client.publish('agrismart/pump-control', JSON.stringify(payload), { qos: 1 }, (err) => {
            if (err) console.error('Failed to publish MQTT message', err);
            else console.log(`🚀 Published MQTT Decision for row ${row.id}:`, payload);
        });

    } catch (err) {
        console.error('Error in decision engine:', err);
    }
};

// 3. Start Polling Loop (Every 5 seconds)
const startEngine = () => {
    console.log('🌱 Starting AgriSmart IoT Decision Engine (Polling every 5s)...');
    setInterval(processSensorData, 5000);
};

module.exports = { startEngine };
