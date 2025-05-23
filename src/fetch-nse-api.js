const { NseIndia } = require('stock-nse-india');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const moment = require('moment');
const MarketOverview = require('../models/MarketOverview');
const { isInTradingHours } = require('./Utils/checkMarketOpen');
dotenv.config();

const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

// Helper function to truncate object to first N words
function getFirstNWords(obj, wordLimit = 200) {
    const jsonString = JSON.stringify(obj, null, 2);
    const words = jsonString.split(/\s+/);
    
    if (words.length <= wordLimit) {
        return jsonString;
    }
    
    return words.slice(0, wordLimit).join(' ') + '... [truncated]';
}

async function fetchNseData() {
    try {
        // Initialize NSE India API
        const nseIndia = new NseIndia();
        
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri, mongooseOptions);
        console.log('Connected to MongoDB successfully');

        // Check if market is open
        // const marketOpen = isInTradingHours();
        // if (!marketOpen) {
        //     console.log(`[${new Date().toISOString()}] Market is not open, skipping fetch`);
        //     return;
        // }

        // Fetch and store data
       // console.log(`[${new Date().toISOString()}] Fetching data from NSE...`);

        // Get NIFTY 50 index data using getEquityStockIndices
        console.log(`[${new Date().toISOString()}] Fetching NIFTY 50 index data...`);
        const nse50Data = await nseIndia.getData("https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050");
        
       // console.log(`[${new Date().toISOString()}] Raw NSE50 Data (first 200 words):`);
       console.log(getFirstNWords(nse50Data, 200));
        
        if (!nse50Data || !nse50Data.data) {
            throw new Error('Invalid data received from NSE');
        }

        console.log(`[${new Date().toISOString()}] Data received successfully`);

        // Log index data
        console.log('\n=== NIFTY 50 Index Data ===');
        console.log(`Index Name: NIFTY 50`);
        console.log(`Date: ${nse50Data.timestamp || 'N/A'}`);

        // Log the stocks data structure
        console.log('\n=== NIFTY 50 Stocks Data Structure ===');
      //  console.log('Keys in response:', Object.keys(nse50Data));

        // Log advance/decline data if available
        console.log('\n=== Market Overview ===');
        if (nse50Data.advance) {
            console.log('Advance/Decline:', nse50Data.advance);
        } else {
            console.log('Advance/Decline data not available in this format');
        }

        let data = nse50Data.data;

        // Format timestamp using moment
        const formattedTimestamp = nse50Data.timestamp 
            ? moment(nse50Data.timestamp, 'DD-MMM-YYYY HH:mm:ss').format('DD-MMM-YYYY HH:mm:ss')
            : "N/A";

        const marketOverview = new MarketOverview({
            name: data.identifier || "NIFTY 50",
            advance: data.advance || {
                declines: "0",
                advances: "0",
                unchanged: "0"
            },
            timestamp: new Date(),
            stockPriceTime: formattedTimestamp,
            data: data
        });

        // Log the data being saved
        console.log('\n=== Saving Market Overview ===');
        console.log('Name:', marketOverview.name);
        console.log('Stock Price Time:', marketOverview.stockPriceTime);
        console.log('Advance/Decline:', marketOverview.advance);

        const savedDoc = await marketOverview.save();
        console.log('Document saved with ID:', savedDoc._id);

        // // Log first stock data as sample
        // if (nse50Data.data && nse50Data.data.length > 0) {
        //     console.log('\n=== Sample Stock Data (First Stock) ===');
        //     console.log('Stock Symbol:', nse50Data.data[0].symbol);
        //     console.log('Available fields:', Object.keys(nse50Data.data[0]));
        //     console.log('Full first stock data (first 200 words):');
        //     console.log(getFirstNWords(nse50Data.data[0], 200));
        // }

        // // Log summary
        // console.log('\n=== Summary ===');
        // console.log('Total stocks in NIFTY 50:', nse50Data.data?.length || 0);
        // console.log('Response structure keys:', Object.keys(nse50Data));

        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching NSE data:`, error.message);
        console.error('Full error:', error);
        
        // Close MongoDB connection in case of error
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        throw error;
    }
}

// Run the script
fetchNseData().catch(console.error);