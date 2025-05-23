const axios = require('axios');
const tough = require('tough-cookie');
const https = require('https');
require('dotenv').config();

const cookieJar = new tough.CookieJar();
let count = 1;
let lastCookieRefresh = null;
const COOKIE_REFRESH_INTERVAL = 1 * 60 * 1000; // 1 minute
const MAX_RETRIES = 5;
let retryCount = 0;

// Random user agents to rotate
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
];

// Function to get random user agent
const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

// Create custom axios instance with keep-alive agent
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({ 
        keepAlive: true,
        timeout: 60000,
        maxSockets: 10,
        maxFreeSockets: 5,
        keepAliveMsecs: 30000,
        rejectUnauthorized: false // Add this to handle SSL issues
    }),
    timeout: 30000,
    maxRedirects: 10
});

// Add retry interceptor with specific handling for 401 and 403 errors
axiosInstance.interceptors.response.use(undefined, async (err) => {
    const config = err.config;
    
    // If it's a 401 or 403 error, we need to refresh cookies
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        if (retryCount >= MAX_RETRIES) {
            console.log(`[${new Date().toISOString()}] Max retries reached for ${err.response.status} errors`);
            return Promise.reject(new Error(`Max retries reached for ${err.response.status} errors`));
        }

        console.log(`[${new Date().toISOString()}] Received ${err.response.status} error, refreshing cookies... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
        retryCount++;
        
        // Add a longer delay before retrying (3-7 seconds)
        const delay = 3000 + Math.random() * 4000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Update user agent
        config.headers['User-Agent'] = getRandomUserAgent();
        
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
        
        // Add a longer delay before making the request (2-5 seconds)
        const delay = 2000 + Math.random() * 3000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // First visit the main page
        const mainPageResponse = await axiosInstance.get('https://www.nseindia.com/', {
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Pragma': 'no-cache',
                'Upgrade-Insecure-Requests': '1',
                'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1'
            }
        });
        
        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Then visit the market data page
        const marketDataResponse = await axiosInstance.get('https://www.nseindia.com/market-data/live-equity-market', {
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Pragma': 'no-cache',
                'Referer': 'https://www.nseindia.com/',
                'Upgrade-Insecure-Requests': '1',
                'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1'
            }
        });
        
        const cookies = [...(mainPageResponse.headers['set-cookie'] || []), ...(marketDataResponse.headers['set-cookie'] || [])];
        if (cookies.length > 0) {
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
            
            // Add random delay to mimic human behavior (3-7 seconds)
            const delay = 3000 + Math.random() * 4000;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            const config = {
                method: 'get',
                url: 'https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050',
                headers: {
                    'authority': 'www.nseindia.com',
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'accept-encoding': 'gzip, deflate, br',
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
                    'user-agent': getRandomUserAgent()
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