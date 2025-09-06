# Quick Start Guide: Creating and Testing Scrapers

## Step 1: Access the Smart Scraper System

1. Open your browser and go to: `http://localhost:3001/admin/smart-scraper`
2. You should see the Smart Scraper System dashboard

## Step 2: Browse Available Memory Data

1. Click the **"Memory"** button in the top-right corner
2. In the dialog that opens, click on the **"Browse Memory"** tab
3. You'll see a list of websites with pre-configured selectors, including:
   - remote-europe.com
   - freshremote.work
   - arc.dev
   - f6s.com
   - dribbble.com/jobs
   - designcrowd.com
   - 99designs.com
   - remote4me.com
   - findbacon.com
   - talent.hubstaff.com
   - jobs.mashable.com
   - jobboardsearch.com

## Step 3: Create a Scraper Configuration (Minimal Steps)

1. **Choose a website from memory:**
   - In the Browse Memory tab, find a website you want to scrape (e.g., "remote-europe.com")
   - Click the **"Load"** button next to it

2. **Configure the scraper:**
   - A form will open with the website name and domain pre-filled
   - Fill in these required fields:
     - **Search Query**: Enter job keywords (e.g., "remote developer", "python", "frontend")
     - **Location**: Enter location or leave empty for "Any" (e.g., "Europe", "Remote")
     - **Max Pages**: Keep default (5) or adjust as needed
   - Leave other settings as default

3. **Save the configuration:**
   - Click **"Save Configuration"**
   - The scraper will be created and activated automatically

## Step 4: Test the Scraper

1. **Run the scraper:**
   - Back on the main dashboard, find your newly created configuration
   - Click the **Play button (▶️)** to run the scraper
   - Or click **"Run All"** to run all active scrapers

2. **Monitor progress:**
   - Switch to the **"Recent Logs"** tab to see scraping progress
   - You'll see real-time updates showing:
     - Status (running/completed/failed)
     - Jobs found and saved
     - Any error messages

3. **View results:**
   - Go to the **"Job Listings"** section in the left sidebar
   - You should see newly scraped jobs from your target website

## Step 5: Verify Data Quality

1. **Check scraped jobs:**
   - Look at the job titles, companies, locations
   - Verify that the data looks accurate and complete
   - Check if application URLs are working

2. **Review analytics:**
   - Go to the **"Analytics"** tab in Smart Scraper System
   - Check success rates and job counts

## Recommended Test Websites

For best results, start with these websites from memory:

1. **remote-europe.com** - Good for European remote jobs
2. **arc.dev** - Tech-focused job board
3. **remote4me.com** - General remote job listings

## Troubleshooting

- **No jobs found**: Try different search terms or check if the website structure changed
- **Scraper fails**: Check the Recent Logs for error messages
- **Incomplete data**: The memory selectors might need updating for changed website layouts

## Next Steps

- **Schedule scrapers**: Enable scheduling to run scrapers automatically
- **Add more websites**: Use the "Add to Memory" tab to configure new websites
- **Import bulk data**: Use the "Import" tab to upload CSV files with multiple configurations

---

**Note**: The memory system contains pre-configured selectors that should work out-of-the-box. If a website has changed its layout, you may need to update the selectors in the memory configuration.