const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fetchData = require('./scraper');
const MarketOverview = require('../models/MarketOverview');
const { isInTradingHours } = require('./Utils/checkMarketOpen');

dotenv.config();

// MongoDB connection options
const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

async function runOnce() {
    try {
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
        console.log(`[${new Date().toISOString()}] Fetching data from NSE...`);
        const data = await fetchData();
        
        if (!data || !data.data) {
            throw new Error('Invalid data received from NSE');
        }

        console.log(`[${new Date().toISOString()}] Data received successfully`);

        // Create market overview document
        const marketOverview = new MarketOverview({
            name: data.name || "NIFTY 50",
            advance: data.advance || {
                declines: "0",
                advances: "0",
                unchanged: "0"
            },
            timestamp: new Date(),
            data: data.data
        });

        // Store in MongoDB
        const savedDoc = await marketOverview.save();
        console.log(`[${new Date().toISOString()}] ✅ Data stored successfully. ID: ${savedDoc._id}`);

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error:`, error.message);
        process.exit(1);
    } finally {
        // Always close the MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Run the script
runOnce(); 