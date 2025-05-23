# NSE Stock Data Scraper

This project scrapes NSE (National Stock Exchange) NIFTY 50 data and stores it in MongoDB. It can be run both locally using cron and through GitHub Actions.

## Features

- Scrapes NSE NIFTY 50 data
- Stores data in MongoDB
- Supports local cron scheduling
- Includes GitHub Actions workflow for automated runs
- Implements retry logic and error handling
- Maintains proper cookies and session management

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or remote instance)
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd <repo-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
MONGODB_URI=mongodb://localhost:27017/nse_stocks
CRON_SCHEDULE="*/15 * * * *"  # Run every 15 minutes
NODE_ENV=development
```

4. For GitHub Actions:
   - Add your MongoDB connection string as a secret named `MONGODB_URI` in your GitHub repository settings
   - The workflow will run automatically during market hours (9:15 AM to 3:30 PM IST, Monday to Friday)

## Usage

### Local Run

To start the scraper with local cron scheduling:

```bash
npm start
```

This will:
- Start the scraper immediately
- Schedule it to run based on the CRON_SCHEDULE in your .env file
- Store data in your configured MongoDB instance

### Manual Run

To run the scraper once without scheduling:

```bash
node src/index.js
```

## Data Structure

The data is stored in MongoDB with the following structure:
- Collection: `nifty50_data`
- Each document includes:
  - Original NSE data
  - `timestamp`: When the data was fetched
  - `createdAt`: When the document was created

## GitHub Actions

The GitHub Actions workflow is configured to:
- Run every 15 minutes during market hours (9:15 AM to 3:30 PM IST, Monday to Friday)
- Can be triggered manually through the GitHub Actions interface
- Uses the MongoDB connection string from repository secrets

## Error Handling

The scraper includes:
- Automatic retry logic for failed requests
- Cookie management
- Proper error logging
- Connection handling for MongoDB

## Contributing

Feel free to submit issues and enhancement requests! 