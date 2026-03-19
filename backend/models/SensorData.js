const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
    sensorType: { type: String, enum: ['moisture', 'temperature', 'ph', 'groundwater'], required: true },
    value: { type: Number, required: true },
    unit: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SensorData', sensorDataSchema);
