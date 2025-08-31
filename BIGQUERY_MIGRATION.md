# BigQuery Migration Guide

## Overview

This project has been migrated from Prisma/SQLite to Google BigQuery for cloud-based data storage. This ensures your financial data is safely stored in the cloud and accessible from anywhere.

## What Changed

### Before (Prisma + SQLite)
- Local SQLite database file
- Data stored on your local machine only
- Risk of data loss if local machine fails
- Limited scalability

### After (BigQuery)
- Cloud-based data storage in Google Cloud
- Data encrypted at rest and in transit
- Automatic backups and redundancy
- Access from anywhere with proper authentication
- Scalable for large datasets

## Migration Steps

### 1. Data Migration
If you had existing data in SQLite, run the migration script:

```bash
pnpm run migrate-to-bigquery
```

This will:
- Initialize BigQuery database and tables
- Migrate all existing data from SQLite
- Preserve all relationships and data integrity

### 2. Verify Migration
Check your BigQuery console to verify:
- Dataset `mymoney` exists
- All tables are created with proper schemas
- Data has been migrated successfully

### 3. Test Application
Verify that your application works correctly:
- Credential management
- Dashboard data display
- Account information
- Statement parsing and storage

## BigQuery Schema

The following tables are created in BigQuery:

- **institutions** - Financial institutions (Chase, Capital One, etc.)
- **accounts** - Credit cards, bank accounts, loans
- **credentials** - Encrypted login credentials
- **statements** - Monthly account statements
- **transactions** - Individual financial transactions
- **aprHistory** - APR rate changes over time
- **limitHistory** - Credit limit changes over time
- **autopays** - Automatic payment settings
- **promotions** - Special offers and promotions
- **scoreSnapshots** - Credit score history
- **plans** - Monthly payment plans
- **allocations** - Payment allocation strategies

## Security Features

- **Encryption at rest**: All data encrypted using Google's encryption
- **Encryption in transit**: TLS encryption for all data transfers
- **Credential encryption**: Login credentials encrypted with your vault passcode
- **Access control**: Google Cloud IAM controls access to data
- **Audit logging**: All access is logged for security monitoring

## Configuration

### Environment Variables
Ensure your Google Cloud service account key file is accessible:
- File: `mymoney-470619-2f22e813a9d7.json`
- Project ID: `mymoney-470619`
- Dataset: `mymoney`

### BigQuery Client
The application uses the `@google-cloud/bigquery` client with:
- Automatic authentication via service account
- Connection pooling for performance
- Error handling and retry logic

## Performance Considerations

- **Query optimization**: BigQuery automatically optimizes queries
- **Caching**: Frequently accessed data is cached
- **Partitioning**: Large tables can be partitioned for better performance
- **Clustering**: Related data is clustered for faster access

## Monitoring and Maintenance

### BigQuery Console
Monitor your data usage and costs in the Google Cloud Console:
- Data storage costs
- Query execution costs
- Performance metrics
- Error logs

### Data Backup
BigQuery automatically provides:
- Data redundancy across multiple locations
- Point-in-time recovery
- Automatic backups
- Disaster recovery

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify service account key file exists
   - Check service account permissions
   - Ensure BigQuery API is enabled

2. **Table Not Found**
   - Run `pnpm run seed` to initialize database
   - Check table names in BigQuery console
   - Verify dataset exists

3. **Query Performance**
   - Use appropriate WHERE clauses
   - Limit result sets with LIMIT
   - Consider table partitioning for large datasets

### Getting Help

- Check BigQuery console for error details
- Review Google Cloud logs
- Consult BigQuery documentation
- Contact Google Cloud support if needed

## Cost Optimization

BigQuery pricing is based on:
- **Storage**: $0.02 per GB per month
- **Queries**: $5 per TB processed
- **Streaming inserts**: $0.01 per 200KB

Tips to reduce costs:
- Use appropriate data types
- Implement data lifecycle policies
- Optimize query patterns
- Monitor usage regularly

## Next Steps

1. **Verify Migration**: Ensure all data migrated correctly
2. **Test Functionality**: Verify all features work with BigQuery
3. **Monitor Performance**: Watch for any performance issues
4. **Optimize Queries**: Fine-tune queries for better performance
5. **Set Up Monitoring**: Configure alerts for costs and errors

## Support

For technical support:
- Check BigQuery documentation
- Review Google Cloud console
- Monitor application logs
- Test with sample data first

Your financial data is now safely stored in the cloud with enterprise-grade security and reliability! 🎉
