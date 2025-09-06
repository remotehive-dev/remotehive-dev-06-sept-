#!/usr/bin/env python3
"""
Excel to Job Board CSV Converter

This script converts Excel files with columns (Name, Website, Region) 
to the required CSV format for RemoteHive job board upload (name, url, search_url).
"""

import pandas as pd
import sys
import os
from urllib.parse import urlparse

def is_valid_url(url):
    """Check if a URL is valid."""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

def convert_excel_to_job_board_csv(excel_file_path, output_csv_path=None):
    """
    Convert Excel file to job board CSV format.
    
    Args:
        excel_file_path (str): Path to the Excel file
        output_csv_path (str): Path for the output CSV file (optional)
    
    Returns:
        str: Path to the converted CSV file
    """
    try:
        # Read Excel file
        print(f"Reading Excel file: {excel_file_path}")
        df = pd.read_excel(excel_file_path)
        
        # Check if required columns exist
        required_excel_columns = ['Name', 'Website', 'Region']
        missing_columns = [col for col in required_excel_columns if col not in df.columns]
        
        if missing_columns:
            print(f"Error: Missing columns in Excel file: {missing_columns}")
            print(f"Available columns: {list(df.columns)}")
            return None
        
        # Create new DataFrame with required format
        converted_df = pd.DataFrame()
        
        # Map columns
        converted_df['name'] = df['Name']
        converted_df['url'] = df['Website']
        
        # Generate search_url from the base website URL
        # This is a basic implementation - you may need to customize per job board
        search_urls = []
        for idx, row in df.iterrows():
            base_url = str(row['Website']).strip()
            
            # Ensure URL has proper protocol
            if not base_url.startswith(('http://', 'https://')):
                base_url = 'https://' + base_url
            
            # Basic search URL generation (customize as needed)
            if 'indeed' in base_url.lower():
                search_url = base_url.rstrip('/') + '/jobs?q={query}&l={location}'
            elif 'linkedin' in base_url.lower():
                search_url = base_url.rstrip('/') + '/jobs/search/?keywords={query}&location={location}'
            elif 'glassdoor' in base_url.lower():
                search_url = base_url.rstrip('/') + '/Job/jobs.htm?sc.keyword={query}&locT=C&locId={location}'
            else:
                # Generic search URL pattern
                search_url = base_url.rstrip('/') + '/jobs?q={query}&location={location}'
            
            search_urls.append(search_url)
        
        converted_df['search_url'] = search_urls
        
        # Add optional columns with default values
        converted_df['selectors'] = '{}'
        converted_df['headers'] = '{}'
        converted_df['max_pages'] = '10'
        converted_df['delay_seconds'] = '2'
        converted_df['rate_limit'] = '60'
        converted_df['enabled'] = 'true'
        converted_df['description'] = df['Region']  # Use region as description
        converted_df['category'] = 'general'
        
        # Validate URLs
        invalid_urls = []
        for idx, row in converted_df.iterrows():
            if not is_valid_url(row['url']):
                invalid_urls.append(f"Row {idx + 1}: Invalid URL '{row['url']}'")
            if not is_valid_url(row['search_url']):
                invalid_urls.append(f"Row {idx + 1}: Invalid search URL '{row['search_url']}'")
        
        if invalid_urls:
            print("Warning: Found invalid URLs:")
            for warning in invalid_urls:
                print(f"  - {warning}")
        
        # Generate output file path if not provided
        if output_csv_path is None:
            base_name = os.path.splitext(os.path.basename(excel_file_path))[0]
            output_csv_path = f"{base_name}_job_board_format.csv"
        
        # Save to CSV
        converted_df.to_csv(output_csv_path, index=False)
        print(f"\nConversion completed successfully!")
        print(f"Output file: {output_csv_path}")
        print(f"Total records: {len(converted_df)}")
        
        # Display sample of converted data
        print("\nSample of converted data:")
        print(converted_df.head(3).to_string(index=False))
        
        return output_csv_path
        
    except Exception as e:
        print(f"Error converting file: {str(e)}")
        return None

def main():
    """Main function for command line usage."""
    if len(sys.argv) < 2:
        print("Usage: python convert_excel_to_csv.py <excel_file_path> [output_csv_path]")
        print("\nExample:")
        print("  python convert_excel_to_csv.py remote_friendly_companies.xlsx")
        print("  python convert_excel_to_csv.py remote_friendly_companies.xlsx job_boards.csv")
        return
    
    excel_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not os.path.exists(excel_file):
        print(f"Error: Excel file '{excel_file}' not found.")
        return
    
    result = convert_excel_to_job_board_csv(excel_file, output_file)
    
    if result:
        print(f"\n✅ Success! Your file has been converted to: {result}")
        print("\n📋 Next steps:")
        print("1. Review the converted CSV file")
        print("2. Upload it to RemoteHive Admin Panel at: http://localhost:3000/admin/smart-scraper")
        print("3. Use the 'Memory Management' section to upload the CSV")
    else:
        print("\n❌ Conversion failed. Please check the error messages above.")

if __name__ == "__main__":
    main()