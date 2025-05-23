const Mapper = {
    dataMapper: (data) => {
        if (!data || !data.data) {
            throw new Error('Invalid data received from NSE');
        }

        // Transform the data to match our schema
        return data.data.map(item => ({
            symbol: item.symbol,
            open: parseFloat(item.open),
            dayHigh: parseFloat(item.dayHigh),
            dayLow: parseFloat(item.dayLow),
            lastPrice: parseFloat(item.lastPrice),
            previousClose: parseFloat(item.previousClose),
            change: parseFloat(item.change),
            pChange: parseFloat(item.pChange),
            totalTradedVolume: parseInt(item.totalTradedVolume),
            totalTradedValue: parseFloat(item.totalTradedValue),
            lastUpdateTime: item.lastUpdateTime,
            
            // Metadata
            metadata: {
                source: 'NSE API',
                version: '1.0'
            },
            
            // Timestamp
            timestamp: new Date()
        }));
    }
};

module.exports = { Mapper }; 