const mongoose = require('mongoose');

const NSE50DataV2 = new mongoose.Schema({
    // Market Data
    symbol: { type: String, required: true, index: true },
    open: { type: Number },
    dayHigh: { type: Number },
    dayLow: { type: Number },
    lastPrice: { type: Number },
    previousClose: { type: Number },
    change: { type: Number },
    pChange: { type: Number },
    totalTradedVolume: { type: Number },
    totalTradedValue: { type: Number },
    lastUpdateTime: { type: String },
    
    // Metadata
    metadata: {
        source: { type: String, default: 'NSE API' },
        version: { type: String, default: '1.0' }
    },
    
    // Timestamps
    timestamp: { type: Date, default: Date.now, index: true }
}, {
    timestamps: true,
    collection: 'nse50v2'
});

module.exports = mongoose.model('NSE50V2', NSE50DataV2); 