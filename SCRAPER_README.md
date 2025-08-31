# Financial Data Scraper

A comprehensive browser automation system for extracting financial account balances from multiple institutions using Playwright and integrating with BigQuery.

## 🚀 Features

- **Multi-Institution Support**: Automatically handles 6 different financial institutions
- **Intelligent Data Extraction**: Uses specialized scrapers for each institution's unique HTML structure
- **BigQuery Integration**: Automatically saves extracted data to your BigQuery database
- **Screenshot Capture**: Takes screenshots for verification and debugging
- **Comprehensive Reporting**: Generates detailed reports of all extracted data
- **Error Handling**: Robust error handling with fallback extraction methods
- **Flexible Execution**: Can run for all institutions or target specific ones

## 🏦 Supported Institutions

| Institution | Script Name | Account Types |
|-------------|-------------|---------------|
| First Interstate Bank | `firstinterstatebank` | Checking, Savings, Credit Cards |
| Capital One | `capitalone` | Credit Cards, Rewards |
| Chase | `chase` | Credit Cards |
| Mission Lane | `missionlane` | Credit Cards |
| Credit One | `CreditOne` | Credit Cards |
| Synchrony Bank | `mysynchrony` | Store Cards, Care Credit |

## 📋 Prerequisites

1. **Node.js & pnpm**: Ensure you have Node.js and pnpm installed
2. **BigQuery Setup**: Your BigQuery credentials should be configured
3. **Playwright**: The browser automation engine (already included in dependencies)

## 🛠️ Installation

The scraper is already integrated into your project. No additional installation is needed.

## 🚀 Usage

### Quick Start - Scrape All Institutions

```bash
npm run scraper:all
```

This will:
- Launch a browser
- Log into each financial institution
- Extract account balances and details
- Save data to BigQuery
- Generate a comprehensive report
- Take screenshots for verification

### Scrape Single Institution

```bash
# By script name
npm run scraper:single firstinterstatebank

# By institution name
npm run scraper:institution "First Interstate Bank"
```

### Get Help

```bash
npm run scraper:help
```

## 📊 Data Extracted

For each account, the scraper extracts:

- **Account Name**: Full account identifier
- **Account Type**: Checking, Savings, Credit, or Loan
- **Current Balance**: Outstanding balance or current amount
- **Available Balance**: Available funds (for checking/savings)
- **Available Credit**: Remaining credit limit (for credit cards)
- **Credit Limit**: Maximum credit available
- **Last 4 Digits**: Last 4 digits of account number
- **Minimum Payment**: Required minimum payment (for credit cards)
- **Extraction Timestamp**: When the data was collected

## 🗄️ Database Integration

The scraper automatically:

1. **Creates Institutions**: Adds new financial institutions to the `institutions` table
2. **Updates Accounts**: Updates existing accounts or creates new ones in the `accounts` table
3. **Records Statements**: Creates new statement records in the `statements` table
4. **Maintains History**: Preserves historical balance data

## 📁 Output Files

### Screenshots
- Location: `screenshots/`
- Format: `{institution}_{timestamp}.png`
- Purpose: Verification and debugging

### Reports
- Location: `reports/`
- Format: `scraping_report_{timestamp}.json`
- Content: Complete extraction summary and data

## 🔧 Configuration

### Environment Variables

You can override credentials using environment variables:

```bash
export FIRSTINTERSTATEBANK_USERNAME="your_username"
export FIRSTINTERSTATEBANK_PASSWORD="your_password"
export CAPITALONE_USERNAME="your_username"
export CAPITALONE_PASSWORD="your_password"
# ... etc for each institution
```

### Customizing Selectors

Edit `scripts/institution-config.ts` to modify:
- Login URLs
- CSS selectors for form fields
- Wait conditions
- Balance extraction patterns

## 🐛 Troubleshooting

### Common Issues

1. **Login Failures**
   - Check credentials in `institution-config.ts`
   - Verify login URLs are correct
   - Check if institutions have changed their login process

2. **Data Extraction Issues**
   - Review screenshots in `screenshots/` folder
   - Check if HTML structure has changed
   - Update selectors in `institution-specific-scrapers.ts`

3. **BigQuery Errors**
   - Verify BigQuery credentials
   - Check database schema matches expected structure
   - Ensure proper permissions

### Debug Mode

The scraper runs in non-headless mode by default, so you can see what's happening in the browser. For production, change `headless: false` to `headless: true` in `scripts/financial-data-scraper.ts`.

## 🔒 Security Considerations

- **Credentials**: Store sensitive credentials in environment variables
- **Network**: Run on secure networks when possible
- **Data**: Financial data is automatically encrypted in BigQuery
- **Access**: Limit access to scraper scripts and configuration files

## 📈 Monitoring & Maintenance

### Regular Tasks

1. **Verify Data**: Check extracted data against manual logins
2. **Update Selectors**: Monitor for website changes
3. **Review Errors**: Check error logs and reports
4. **Test Credentials**: Ensure login credentials remain valid

### Performance

- **Execution Time**: Full scraping takes approximately 10-15 minutes
- **Resource Usage**: Moderate CPU and memory usage during execution
- **Network**: Requires stable internet connection

## 🚨 Important Notes

1. **Rate Limiting**: The scraper includes delays to avoid triggering security measures
2. **Terms of Service**: Ensure compliance with each institution's terms of service
3. **Data Accuracy**: Verify extracted data manually for critical financial decisions
4. **Backup**: Always maintain manual access to accounts as backup

## 🤝 Contributing

To add support for new institutions:

1. Add configuration to `institution-config.ts`
2. Create specialized scraper in `institution-specific-scrapers.ts`
3. Update the `INSTITUTION_SCRAPERS` mapping
4. Test thoroughly with the new institution

## 📞 Support

For issues or questions:
1. Check the error logs and reports
2. Review screenshots for visual verification
3. Check if HTML structure has changed
4. Verify BigQuery connectivity and permissions

## 📄 License

This scraper is part of your personal financial management system. Use responsibly and in compliance with all applicable terms of service.
