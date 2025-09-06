BEGIN TRANSACTION;
CREATE TABLE scraper_website_mapping (
            scraper_config_id INTEGER NOT NULL,
            managed_website_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (scraper_config_id, managed_website_id),
            FOREIGN KEY (scraper_config_id) REFERENCES scraper_configs(id),
            FOREIGN KEY (managed_website_id) REFERENCES managed_websites(id)
        );
CREATE INDEX idx_scraper_website_mapping_scraper_id ON scraper_website_mapping(scraper_config_id);
CREATE INDEX idx_scraper_website_mapping_website_id ON scraper_website_mapping(managed_website_id);
CREATE INDEX idx_scraper_website_mapping_created_at ON scraper_website_mapping(created_at);
COMMIT;
