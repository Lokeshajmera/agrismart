const mqtt = require('mqtt');
const supabase = require('./supabase');
const fs = require('fs');

const STATE_FILE = './farmState.json';

// -------- GLOBAL MEMORY STATE --------
// Prevents high-frequency ESP32 database appends from overwriting user dashboards
let farmState = {
    mode1: 'auto',
    mode2: 'auto',
    pump1: false,
    pump2: false
};

// CRITICAL FIX: Load from disk immediately upon restart. If Node.js crashes due to Wi-Fi drops, 
// this guarantees the manual 'RIGID' state perfectly survives the restart instead of defaulting back to 'auto'!
if (fs.existsSync(STATE_FILE)) {
    try {
        farmState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch (e) {
        console.error("Could not parse farmState.json", e);
    }
}

const persistState = () => {
    try { fs.writeFileSync(STATE_FILE, JSON.stringify(farmState), 'utf8'); } catch (e) { }
};

// -------- MQTT CONFIG --------
const brokerUrl = process.env.MQTT_BROKER_URL || 'wss://q5117576.ala.asia-southeast1.emqxsl.com:8084/mqtt';

const options = {
    username: process.env.MQTT_USERNAME || 'espnew',
    password: process.env.MQTT_PASSWORD || 'Pratham@123',
    clientId: `agrismart_backend_${Math.random().toString(16).slice(2)}`,
    rejectUnauthorized: true,
    connectTimeout: 10000,
    reconnectPeriod: 3000,
};

// -------- MQTT CONNECT --------
const client = mqtt.connect(brokerUrl, options);

client.on('connect', () => {
    console.log('✅ Connected to HiveMQ Cloud');
});

client.on('error', (err) => {
    console.error('❌ MQTT Error:', err);
});

client.on('reconnect', () => {
    console.log('🔄 Reconnecting to MQTT...');
});

client.on('offline', () => {
    console.log('⚠️ MQTT Offline');
});

// Health Tracker
let lastReceivedTime = Date.now();

// -------- MAIN ENGINE --------
const processSensorData = async () => {
    try {
        // 1. Fetch unprocessed row
        const { data, error } = await supabase
            .from('sensor_data')
            .select('*')
            .eq('processed', false)
            .order('created_at', { ascending: true })
            .limit(1);

        if (error) throw error;

        // SYSTEM HEALTH CHECK "COUT"
        if (!data || data.length === 0) {
            const idleSeconds = Math.floor((Date.now() - lastReceivedTime) / 1000);
            if (idleSeconds > 25) {
                console.log(`🔴 SYSTEM OFFLINE: No new entries from ESP32 in ${idleSeconds}s.`);
            } else {
                console.log(`⏳ System IDLE: Waiting for next ESP32 entry...`);
            }
            return;
        }

        // New data arrived
        lastReceivedTime = Date.now();
        console.log(`🟢 SYSTEM ONLINE: New entry received! Processing Row ID: ${data[0].id}`);

        const row = data[0];

        // -------- SENSOR PROCESSING --------
        const moisture = row.moisture || 0;
        const s1 = row.soil1 != null ? row.soil1 : moisture;
        const s2 = row.soil2 != null ? row.soil2 : moisture;
        const s3 = row.soil3 != null ? row.soil3 : moisture;
        const s4 = row.soil4 != null ? row.soil4 : moisture;

        const avg1 = (s1 + s2) / 2;
        const avg2 = (s3 + s4) / 2;

        // Safe temperature handling
        let temp = 0;
        if (row.temperature != null) {
            temp = row.temperature;
        } else {
            temp = (row.temp1 && row.temp2)
                ? (row.temp1 + row.temp2) / 2
                : (row.temp1 || row.temp2 || 0);
        }

        // -------- MODES --------
        // Use Global RAM state instead of raw appended Database strings
        const mode1 = farmState.mode1;
        const mode2 = farmState.mode2;

        let pump1 = farmState.pump1;
        let pump2 = farmState.pump2;

        // -------- ZONE 1 --------
        if (mode1 === 'manual') {
            pump1 = farmState.pump1;
        } else {
            if (avg1 > 60) pump1 = false;
            else if (avg1 < 35) pump1 = true;
            else if (temp > 28 && avg1 < 45) pump1 = true;
            else if (temp < 15) pump1 = false;
            else pump1 = false;
        }

        // -------- ZONE 2 --------
        if (mode2 === 'manual') {
            pump2 = farmState.pump2;
        } else {
            if (avg2 > 60) pump2 = false;
            else if (avg2 < 35) pump2 = true;
            else if (temp > 28 && avg2 < 45) pump2 = true;
            else if (temp < 15) pump2 = false;
            else pump2 = false;
        }

        // -------- SAFETY FAILSAFE --------
        if (avg1 === 0 && avg2 === 0) {
            pump1 = false;
            pump2 = false;
            console.log("⚠️ Sensor failure detected → Pumps OFF");
        }

        // Ensure boolean & synchronize the auto-decisions back into RAM for persistence
        farmState.pump1 = Boolean(pump1);
        farmState.pump2 = Boolean(pump2);
        persistState();

        // -------- UPDATE DATABASE --------
        const { error: updateError } = await supabase
            .from('sensor_data')
            .update({
                irrigation1: pump1,
                irrigation2: pump2,
                processed: true,
                processed_at: new Date().toISOString()
            })
            .eq('id', row.id)
            .eq('processed', false); // prevents duplicate processing

        if (updateError) throw updateError;

        // -------- MQTT PAYLOAD --------
        const payload = {
            pump1,
            pump2,
            mode1,
            mode2,
            timestamp: new Date().toISOString()
        };

        // -------- MQTT TOPIC (SCALABLE) --------
        const topic = `agrismart/pump-control`; // Enforced match with ESP32

        // -------- MQTT PUBLISH --------
        if (client.connected) {
            client.publish(
                topic,
                JSON.stringify(payload),
                { qos: 1, retain: true },
                (err) => {
                    if (err) {
                        console.error('❌ MQTT Publish Failed:', err);
                    } else {
                        console.log(`🚀 Published to ${topic}:`, payload);
                    }
                }
            );
        } else {
            console.log("⚠️ MQTT not connected, will retry next cycle");
        }

    } catch (err) {
        console.error('❌ Engine Error:', err);
    }
};

// -------- START ENGINE --------
const startEngine = () => {
    console.log('🌱 AgriSmart Decision Engine Running (5s interval)');
    setInterval(processSensorData, 5000);
};

// -------- FAST-API OVERRIDE --------
const overridePump = async ({ areaId, mode, pump }) => {
    if (areaId === 1) {
        if (mode !== undefined) farmState.mode1 = mode;
        if (pump !== undefined) farmState.pump1 = Boolean(pump);
    } else if (areaId === 2) {
        if (mode !== undefined) farmState.mode2 = mode;
        if (pump !== undefined) farmState.pump2 = Boolean(pump);
    } else if (areaId === 'global') {
        farmState.mode1 = mode;
        farmState.mode2 = mode;

        // CRITICAL FIX: If switching from Manual to Auto, we must re-evaluate right now!
        // Otherwise, if you turned it ON in manual mode, and switch to Auto, it will stay ON 
        // indefinitely because the 5-sec heartbeat hasn't natively intercepted it yet.
        if (mode === 'auto') {
            try {
                const { data } = await supabase.from('sensor_data').select('*').order('created_at', { ascending: false }).limit(1);
                if (data && data.length > 0) {
                    const row = data[0];
                    const moisture = row.moisture || 0;
                    const avg1 = ((row.soil1 != null ? row.soil1 : moisture) + (row.soil2 != null ? row.soil2 : moisture)) / 2;
                    const avg2 = ((row.soil3 != null ? row.soil3 : moisture) + (row.soil4 != null ? row.soil4 : moisture)) / 2;
                    const temp = row.temperature || ((row.temp1 || row.temp2) ? ((row.temp1 || 0) + (row.temp2 || 0)) / 2 : 0);

                    // Re-run Matrix logic locally
                    if (avg1 > 60) farmState.pump1 = false;
                    else if (avg1 < 35) farmState.pump1 = true;
                    else if (temp > 28 && avg1 < 45) farmState.pump1 = true;
                    else if (temp < 15) farmState.pump1 = false;
                    else farmState.pump1 = false;

                    if (avg2 > 60) farmState.pump2 = false;
                    else if (avg2 < 35) farmState.pump2 = true;
                    else if (temp > 28 && avg2 < 45) farmState.pump2 = true;
                    else if (temp < 15) farmState.pump2 = false;
                    else farmState.pump2 = false;
                }
            } catch (e) {
                console.error("Matrix Re-Evaluation Failed:", e);
            }
        }
    }

    // Unconditionally save the user's manual preference to disk so it survives server crashes!
    persistState();

    const payload = {
        pump1: farmState.pump1,
        pump2: farmState.pump2,
        mode1: farmState.mode1,
        mode2: farmState.mode2,
        timestamp: new Date().toISOString()
    };

    if (client.connected) {
        client.publish('agrismart/pump-control', JSON.stringify(payload), { qos: 1, retain: true }, (err) => {
            if (!err) console.log(`⚡ DIRECT OVERRIDE FIRED:`, payload);
        });
    }

    // IMMEDIATELY sync RAM state to Database to permanently kill the race condition
    try {
        const { data } = await supabase.from('sensor_data').select('id').order('created_at', { ascending: false }).limit(1);
        if (data && data.length > 0) {
            await supabase.from('sensor_data').update({
                irrigation1: farmState.pump1,
                irrigation2: farmState.pump2,
                processed: true,
                processed_at: new Date().toISOString()
            }).eq('id', data[0].id);
        }
    } catch (e) {
        console.error("Fast-Path Database Sync Error:", e);
    }
};

module.exports = { startEngine, overridePump };
