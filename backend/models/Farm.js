const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    cropType: { type: String, default: 'Wheat' },
    sizeAcres: { type: Number, required: true },
    coordinates: {
        lat: Number,
        lng: Number
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Farm', farmSchema);
