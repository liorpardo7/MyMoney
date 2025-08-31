# BigQuery Admin Panel

The BigQuery Admin Panel provides a comprehensive interface for managing all BigQuery table data in your MyMoney application.

## Features

### 🗂️ Table Management
- **View all tables** with row counts and schema information
- **Tabbed interface** for easy navigation between tables
- **Real-time data** with automatic refresh capabilities

### 📊 Data Operations
- **View data** with pagination (50 rows per page)
- **Search functionality** across all searchable fields
- **Edit existing rows** inline with type-aware editors
- **Add new rows** with form validation
- **Delete rows** with confirmation prompts

### 🔧 Smart Field Editing
- **Boolean fields**: Dropdown selectors (True/False)
- **Numeric fields**: Number inputs with validation
- **Timestamp fields**: Date-time pickers
- **String fields**: Text inputs
- **Required field indicators** (marked with red asterisk)

### 📱 Responsive Design
- **Mobile-friendly** interface
- **Responsive grid layouts** for forms
- **Touch-friendly** controls

## Access

Navigate to `/admin` in your application to access the admin panel.

## Usage

### Viewing Tables
1. Click on any table tab to view its data
2. Use the search bar to find specific records
3. Navigate through pages using the pagination controls

### Editing Data
1. Click the "Edit" button on any row
2. Modify the fields as needed
3. Click "Save" to apply changes or "Cancel" to discard

### Adding New Rows
1. Fill out the "Add New Row" form at the top of each table
2. Required fields are marked with a red asterisk (*)
3. Click "Add Row" to insert the new record

### Deleting Rows
1. Click the "Delete" button on any row
2. Confirm the deletion in the popup dialog

## API Endpoints

### GET `/api/admin/tables`
Returns metadata for all tables including:
- Table names
- Row counts
- Schema definitions

### GET `/api/admin/tables/[tableName]`
Returns paginated data for a specific table with:
- Query parameters: `page`, `limit`, `search`
- Response: `{ rows, total, page, limit, totalPages }`

### POST `/api/admin/tables/[tableName]`
Creates a new row in the specified table

### PUT `/api/admin/tables/[tableName]`
Updates an existing row in the specified table

### DELETE `/api/admin/tables/[tableName]`
Deletes a row from the specified table

## Security Considerations

⚠️ **Important**: This admin panel provides full access to your BigQuery data. Consider:

- Implementing authentication/authorization
- Restricting access to admin users only
- Adding audit logging for data changes
- Implementing rate limiting for API endpoints

## Supported Table Types

The admin panel automatically detects and handles:
- `institutions` - Financial institution data
- `accounts` - Account information
- `credentials` - Login credentials
- `statements` - Account statements
- `transactions` - Transaction records
- `aprHistory` - APR history data
- `limitHistory` - Credit limit history
- `autopays` - Automatic payment settings
- `promotions` - Promotional offers
- `scoreSnapshots` - Credit score snapshots
- `plans` - Financial plans
- `allocations` - Payment allocations

## Troubleshooting

### Common Issues

1. **Table not loading**: Check BigQuery connection and permissions
2. **Edit not saving**: Verify the row has a valid ID field
3. **Search not working**: Ensure the table has searchable text fields

### Error Handling

The panel includes comprehensive error handling:
- Network errors are logged to console
- User-friendly error messages
- Graceful fallbacks for missing data

## Development

### Adding New Tables
1. Add table schema to `lib/bigquery.ts`
2. The admin panel will automatically detect new tables
3. No additional frontend code required

### Customizing Field Editors
Modify the `renderFieldEditor` function in the admin page component to add custom field types or validation.

### Styling
The panel uses Tailwind CSS classes and can be customized by modifying the component styles.
