const mongoose = require('mongoose');

const StockDataSchema = new mongoose.Schema({
    priority: { type: Number },
    symbol: { type: String, required: true },
    identifier: { type: String, required: true },
    series: { type: String },
    open: { type: Number },
    dayHigh: { type: Number },
    dayLow: { type: Number },
    lastPrice: { type: Number },
    previousClose: { type: Number },
    change: { type: Number },
    pChange: { type: Number },
    ffmc: { type: Number },
    yearHigh: { type: Number },
    yearLow: { type: Number },
    totalTradedVolume: { type: Number },
    totalTradedValue: { type: Number },
    lastUpdateTime: { type: String },
    nearWKH: { type: Number },
    nearWKL: { type: Number },
    perChange365d: { type: mongoose.Schema.Types.Mixed }, // Can be number or "-"
    date365dAgo: { type: mongoose.Schema.Types.Mixed }, // Can be date string or "-"
    chart365dPath: { type: String },
    date30dAgo: { type: mongoose.Schema.Types.Mixed }, // Can be date string or "-"
    perChange30d: { type: mongoose.Schema.Types.Mixed }, // Can be number or "-"
    chart30dPath: { type: String },
    chartTodayPath: { type: String },
    meta: {
        symbol: { type: String },
        companyName: { type: String },
        industry: { type: String },
        activeSeries: [{ type: String }],
        debtSeries: [{ type: String }],
        isFNOSec: { type: Boolean },
        isCASec: { type: Boolean },
        isSLBSec: { type: Boolean },
        isDebtSec: { type: Boolean },
        isSuspended: { type: Boolean },
        tempSuspendedSeries: [{ type: String }],
        isETFSec: { type: Boolean },
        isDelisted: { type: Boolean },
        isin: { type: String },
        slb_isin: { type: String },
        listingDate: { type: String },
        isMunicipalBond: { type: Boolean },
        isHybridSymbol: { type: Boolean },
        quotepreopenstatus: {
            equityTime: { type: String },
            preOpenTime: { type: String },
            QuotePreOpenFlag: { type: Boolean }
        }
    }
});

const MarketOverviewSchema = new mongoose.Schema({
    name: { type: String, required: true },
    advance: {
        declines: { type: String },
        advances: { type: String },
        unchanged: { type: String }
    },
    timestamp: { type: Date, default: Date.now, index: true },
    data: [StockDataSchema]
}, {
    timestamps: true,
    collection: 'market_overview'
});

// Create compound index on name and timestamp for efficient querying
MarketOverviewSchema.index({ name: 1, timestamp: -1 });

module.exports = mongoose.model('MarketOverview', MarketOverviewSchema); 