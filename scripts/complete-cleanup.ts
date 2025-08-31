import { bigqueryDB } from '../lib/bigquery';

async function completeCleanup() {
  try {
    console.log('🧹 Starting complete database cleanup...\n');
    
    // Delete all statements
    console.log('🗑️ Deleting all statements...');
    await bigqueryDB.query(`
      DELETE FROM \`mymoney-470619.mymoney.statements\`
      WHERE 1=1
    `);
    console.log('✅ All statements deleted');
    
    // Delete all accounts
    console.log('🗑️ Deleting all accounts...');
    await bigqueryDB.query(`
      DELETE FROM \`mymoney-470619.mymoney.accounts\`
      WHERE 1=1
    `);
    console.log('✅ All accounts deleted');
    
    // Delete all institutions
    console.log('🗑️ Deleting all institutions...');
    await bigqueryDB.query(`
      DELETE FROM \`mymoney-470619.mymoney.institutions\`
      WHERE 1=1
    `);
    console.log('✅ All institutions deleted');
    
    // Delete all transactions
    console.log('🗑️ Deleting all transactions...');
    await bigqueryDB.query(`
      DELETE FROM \`mymoney-470619.mymoney.transactions\`
      WHERE 1=1
    `);
    console.log('✅ All transactions deleted');
    
    console.log('\n🎉 Complete cleanup finished! Database is now empty.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

completeCleanup();
