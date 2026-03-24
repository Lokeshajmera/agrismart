const mqtt = require('mqtt');
const supabase = require('./supabase');
const fs = require('fs');

const STATE_FILE = './farmState.json';

// -------- GLOBAL MEMORY STATE --------
// Singleton State
let farmState = {
    mode1: 'auto',
    mode2: 'auto',
    pump1: false,
    pump2: false,
    lastPublishedPayloadStr: ""
};

// CRITICAL FIX: Load from disk immediately upon restart.
if (fs.existsSync(STATE_FILE)) {
    try {
        farmState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        console.log("📂 Loaded state from disk:", farmState);
    } catch (e) {
        console.error("Could not parse farmState.json", e);
    }
}

// NEW: Boot sync from Supabase to ensure RAM is not stale
const syncStateFromDB = async () => {
    try {
        const { data, error } = await supabase
            .from('sensor_data')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (data && data.length > 0) {
            const row = data[0];
            // farmState.mode1 = row.irrigation_mode1 || 'auto'; // DECOUPLED
            // farmState.mode2 = row.irrigation_mode2 || 'auto'; // DECOUPLED
            farmState.pump1 = Boolean(row.irrigation1);
            farmState.pump2 = Boolean(row.irrigation2);
            console.log("🔄 Synced farmState from latest DB row:", farmState);
            persistState();
        }
    } catch (e) {
        console.error("Failed to sync state from DB on boot", e);
    }
};

const persistState = () => {
    try { 
        fs.writeFileSync(STATE_FILE, JSON.stringify(farmState), 'utf8'); 
    } catch (e) { 
        console.error("Failed to write state file", e);
    }
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
    if (!isMqttConnected) {
        console.log('✅ Connected to HiveMQ Cloud');
        isMqttConnected = true;
    }
});

client.on('error', (err) => {
    if (Date.now() - lastNetErrorTime > NET_ERROR_MUTE_MS) {
        console.error('❌ MQTT Error:', err.message || err);
        lastNetErrorTime = Date.now();
    }
    isMqttConnected = false;
});

client.on('reconnect', () => {
    if (isMqttConnected) {
        console.log('🔄 MQTT Connection lost, reconnecting...');
        isMqttConnected = false;
    }
});

client.on('offline', () => {
    if (isMqttConnected) {
        console.log('⚠️ MQTT Offline');
        isMqttConnected = false;
    }
});

// Health Tracker
let lastReceivedTime = Date.now();
let isMqttConnected = false;
let lastNetErrorTime = 0;
const NET_ERROR_MUTE_MS = 30000;

// -------- MAIN ENGINE --------
const processLatestUnprocessed = async () => {
    try {
        const { data, error } = await supabase
            .from('sensor_data')
            .select('*')
            .eq('processed', false)
            .order('id', { ascending: false }) 
            .limit(1);

        if (error) {
            if (Date.now() - lastNetErrorTime > NET_ERROR_MUTE_MS) {
                console.error("⚠️ Supabase Connection Error (Engine):", error.message);
                lastNetErrorTime = Date.now();
            }
            return;
        }

        lastNetErrorTime = 0;

        if (!data || data.length === 0) {
            const idleSeconds = Math.floor((Date.now() - lastReceivedTime) / 1000);
            if (idleSeconds > 60) {
                console.log(`🔴 SYSTEM OFFLINE: No new entries from ESP32 in ${idleSeconds}s.`);
            }
            return;
        }

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
        const isRaining = Boolean(row.rain); // NEW: Rain Sensor Detection

        let pump1 = farmState.pump1;
        let pump2 = farmState.pump2;

        let temp = 0;
        if (row.temperature != null) {
            temp = row.temperature;
        } else {
            temp = (row.temp1 && row.temp2)
                ? (row.temp1 + row.temp2) / 2
                : (row.temp1 || row.temp2 || 0);
        }

        // -------- ZONE 1 --------
        if (farmState.mode1 === 'manual') {
            pump1 = farmState.pump1;
        } else {
            if (isRaining) pump1 = false; // RAIN DELAY
            else if (avg1 > 60) pump1 = false;
            else if (avg1 < 35) pump1 = true;
            else if (temp > 28 && avg1 < 45) pump1 = true;
            else if (temp < 15) pump1 = false;
            else pump1 = false;
        }

        // -------- ZONE 2 --------
        if (farmState.mode2 === 'manual') {
            pump2 = farmState.pump2;
        } else {
            if (isRaining) pump2 = false; // RAIN DELAY
            else if (avg2 > 60) pump2 = false;
            else if (avg2 < 35) pump2 = true;
            else if (temp > 28 && avg2 < 45) pump2 = true;
            else if (temp < 15) pump2 = false;
            else pump2 = false;
        }

        // -------- SAFETY FAILSAFE --------
        if (farmState.mode1 === 'auto' && avg1 === 0 && avg2 === 0) pump1 = false;
        if (farmState.mode2 === 'auto' && avg1 === 0 && avg2 === 0) pump2 = false;

        if (farmState.mode1 === 'auto') farmState.pump1 = Boolean(pump1);
        if (farmState.mode2 === 'auto') farmState.pump2 = Boolean(pump2);
        
        persistState();

        // -------- UPDATE DATABASE & FLUSH BACKLOG --------
        try {
            await supabase
                .from('sensor_data')
                .update({
                    // irrigation_mode1: farmState.mode1, // DECOUPLED
                    // irrigation_mode2: farmState.mode2, // DECOUPLED
                    irrigation1: farmState.pump1,
                    irrigation2: farmState.pump2,
                    processed: true,
                    processed_at: new Date().toISOString()
                })
                .eq('id', row.id);

            await supabase
                .from('sensor_data')
                .update({ processed: true, processed_at: new Date().toISOString() })
                .eq('processed', false)
                .lt('id', row.id);
        } catch (dbErr) {
            if (Date.now() - lastNetErrorTime > NET_ERROR_MUTE_MS) {
                console.error("⚠️ Database sync error in engine", dbErr.message);
                lastNetErrorTime = Date.now();
            }
        }

        // -------- MQTT PAYLOAD --------
        const payload = {
            pump1: Boolean(farmState.pump1),
            pump2: Boolean(farmState.pump2),
            irrigation1: Boolean(farmState.pump1),
            irrigation2: Boolean(farmState.pump2),
            mode1: farmState.mode1,
            mode2: farmState.mode2,
            timestamp: new Date().toISOString()
        };

        const currentPayloadStr = JSON.stringify({ pump1: farmState.pump1, pump2: farmState.pump2, mode1: farmState.mode1, mode2: farmState.mode2 });
        
        console.log(`🧠 AI Evaluation: \n${JSON.stringify(payload, null, 2)}`);

        // -------- OPTIMIZED BROADCAST: CHANGE-ONLY --------
        if (currentPayloadStr !== farmState.lastPublishedPayloadStr) {
            farmState.lastPublishedPayloadStr = currentPayloadStr;
            
            if (client.connected) {
                client.publish(
                    `agrismart/pump-control`,
                    JSON.stringify(payload),
                    { qos: 1, retain: true },
                    (err) => {
                        if (err) {
                            console.error(`❌ MQTT Publish Failed:`, err);
                            farmState.lastPublishedPayloadStr = ""; 
                        } else {
                            console.log(`🚀 Published to MQTT (Change Detected):`, payload);
                        }
                    }
                );
            }
        }
    } catch (err) {
        if (Date.now() - lastNetErrorTime > NET_ERROR_MUTE_MS) {
            console.error('❌ Engine Error:', err.message || err);
            lastNetErrorTime = Date.now();
        }
    }
};

const startEngine = async () => {
    console.log('🌱 AgriSmart Decision Engine Starting...');
    await syncStateFromDB();
    console.log('📡 AI Watchdog running on 30s interval');
    setInterval(processLatestUnprocessed, 30000);
};

const overridePump = async ({ areaId, mode, pump }) => {
    console.log(`📡 OVERRIDE RECEIVED: areaId=${areaId}, mode=${mode}, pump=${pump}`);
    
    if (areaId === 1) {
        if (mode !== undefined) farmState.mode1 = mode;
        if (pump !== undefined) farmState.pump1 = Boolean(pump);
    } else if (areaId === 2) {
        if (mode !== undefined) farmState.mode2 = mode;
        if (pump !== undefined) farmState.pump2 = Boolean(pump);
    } else if (areaId === 'global') {
        if (mode !== undefined) { farmState.mode1 = mode; farmState.mode2 = mode; }
        if (mode === 'auto') {
            try {
                const { data } = await supabase.from('sensor_data').select('*').order('created_at', { ascending: false }).limit(1);
                if (data && data.length > 0) {
                    const row = data[0];
                    const moisture = row.moisture || 0;
                    const avg1 = ((row.soil1 != null ? row.soil1 : moisture) + (row.soil2 != null ? row.soil2 : moisture)) / 2;
                    const avg2 = ((row.soil3 != null ? row.soil3 : moisture) + (row.soil4 != null ? row.soil4 : moisture)) / 2;
                    const temp = row.temperature || ((row.temp1 || row.temp2) ? ((row.temp1 || 0) + (row.temp2 || 0)) / 2 : 0);

                    if (avg1 > 60) farmState.pump1 = false;
                    else if (avg1 < 35) farmState.pump1 = true;
                    else if (temp > 28 && avg1 < 45) farmState.pump1 = true;
                    else farmState.pump1 = false;

                    if (avg2 > 60) farmState.pump2 = false;
                    else if (avg2 < 35) farmState.pump2 = true;
                    else if (temp > 28 && avg2 < 45) farmState.pump2 = true;
                    else farmState.pump2 = false;
                }
            } catch (e) {}
        }
    }

    persistState();
    const payload = {
        pump1: Boolean(farmState.pump1),
        pump2: Boolean(farmState.pump2),
        irrigation1: Boolean(farmState.pump1),
        irrigation2: Boolean(farmState.pump2),
        mode1: farmState.mode1,
        mode2: farmState.mode2,
        timestamp: new Date().toISOString()
    };

    if (client.connected) {
        client.publish('agrismart/pump-control', JSON.stringify(payload), { qos: 1, retain: true }, (err) => {
            if (!err) {
                console.log(`⚡ DIRECT OVERRIDE FIRED:`, payload);
                farmState.lastPublishedPayloadStr = JSON.stringify({ pump1: farmState.pump1, pump2: farmState.pump2, mode1: farmState.mode1, mode2: farmState.mode2 });
            }
        });
    }

    try {
        const { data } = await supabase.from('sensor_data').select('id').order('created_at', { ascending: false }).limit(1);
        if (data && data.length > 0) {
            await supabase.from('sensor_data').update({
                // irrigation_mode1: farmState.mode1, // DECOUPLED
                // irrigation_mode2: farmState.mode2, // DECOUPLED
                irrigation1: farmState.pump1,
                irrigation2: farmState.pump2,
                processed: true,
                processed_at: new Date().toISOString()
            }).eq('id', data[0].id);
        }
    } catch (e) {}
};

module.exports = { startEngine, overridePump, processLatestUnprocessed, farmState };
