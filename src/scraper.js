const axios = require('axios');
const tough = require('tough-cookie');
const https = require('https');
require('dotenv').config();

const cookieJar = new tough.CookieJar();
let count = 1;
let lastCookieRefresh = null;
const COOKIE_REFRESH_INTERVAL = 1 * 60 * 1000; // 30 minutes
const MAX_RETRIES = 30;
let retryCount = 0;

// Create custom axios instance with keep-alive agent
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({ 
        keepAlive: true,
        timeout: 60000,
        maxSockets: 10,
        maxFreeSockets: 5,
        keepAliveMsecs: 30000
    }),
    timeout: 30000,
    maxRedirects: 10
});

// Add retry interceptor with specific handling for 401 errors
axiosInstance.interceptors.response.use(undefined, async (err) => {
    const config = err.config;
    
    // If it's a 401 error, we need to refresh cookies
    if (err.response && err.response.status === 401) {
        if (retryCount >= MAX_RETRIES) {
            console.log(`[${new Date().toISOString()}] Max retries reached for 401 errors`);
            return Promise.reject(new Error('Max retries reached for 401 errors'));
        }

        console.log(`[${new Date().toISOString()}] Received 401 error, refreshing cookies... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
        retryCount++;
        
        // Add a delay before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const cookiesRefreshed = await refreshCookies();
        if (cookiesRefreshed) {
            // Update the cookie header for the retry
            config.headers.cookie = cookieJar.getCookieStringSync('https://www.nseindia.com');
            return axiosInstance(config);
        }
    }
    
    return Promise.reject(err);
});

// Function to refresh cookies
async function refreshCookies() {
    try {
        // Clear existing cookies
        cookieJar.removeAllCookiesSync();
        
        // Add a delay before making the request
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get new cookies
        const response = await axiosInstance.get('https://www.nseindia.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Pragma': 'no-cache',
                'Upgrade-Insecure-Requests': '1',
                'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"'
            }
        });
        
        const cookies = response.headers['set-cookie'];
        if (cookies) {
            cookies.forEach(cookie => {
                cookieJar.setCookieSync(cookie, 'https://www.nseindia.com');
            });
            lastCookieRefresh = new Date();
            console.log(`[${new Date().toISOString()}] Successfully refreshed cookies`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error refreshing cookies:`, error.message);
        return false;
    }
}

// Function to check if cookies need refresh
async function ensureValidCookies() {
    if (!lastCookieRefresh || (new Date() - lastCookieRefresh) > COOKIE_REFRESH_INTERVAL) {
        return await refreshCookies();
    }
    return true;
}

async function fetchData() {
    return new Promise(async (resolve, reject) => {
        try {
            // Reset retry count for new fetch attempt
            retryCount = 0;
            
            // Ensure we have valid cookies
            const cookiesValid = await ensureValidCookies();
            if (!cookiesValid) {
                throw new Error('Failed to obtain valid cookies');
            }
            
            // Add random delay to mimic human behavior
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
            
            const config = {
                method: 'get',
                url: 'https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050',
                headers: {
                    'authority': 'www.nseindia.com',
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'cookie': cookieJar.getCookieStringSync('https://www.nseindia.com'),
                    'dnt': '1',
                    'referer': 'https://www.nseindia.com/market-data/live-equity-market',
                    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'cache-control': 'no-cache',
                    'pragma': 'no-cache',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            };

            const response = await axiosInstance.request(config);
            
            // Validate response data
            if (!response.data || !response.data.data) {
                throw new Error('Invalid response data received from NSE');
            }
            
            console.log(`[${new Date().toISOString()}] Data fetched successfully --------- ${count}`);
            count++;
            resolve(response.data);
            
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Failed to fetch data:`, error.message);
            reject(error);
        }
    });
}

module.exports = fetchData; 