import { bigqueryDB } from '../lib/bigquery';

async function cleanupFakeData() {
  try {
    console.log('🧹 Starting cleanup of fake data...');

    // Delete all fake statements
    console.log('🗑️ Deleting fake statements...');
    await bigqueryDB.query(`
      DELETE FROM \`mymoney-470619.mymoney.statements\`
      WHERE accountId IN (
        'acc_credit_001', 'acc_credit_002', 'acc_credit_003', 'acc_credit_004',
        'acc_credit_005', 'acc_credit_006', 'acc_credit_007', 'acc_credit_008',
        'acc_credit_009', 'acc_credit_010', 'acc_credit_011', 'acc_credit_012'
      )
    `);
    console.log('✅ Fake statements deleted');

    // Delete all fake accounts
    console.log('🗑️ Deleting fake accounts...');
    await bigqueryDB.query(`
      DELETE FROM \`mymoney-470619.mymoney.accounts\`
      WHERE id IN (
        'acc_credit_001', 'acc_credit_002', 'acc_credit_003', 'acc_credit_004',
        'acc_credit_005', 'acc_credit_006', 'acc_credit_007', 'acc_credit_008',
        'acc_credit_009', 'acc_credit_010', 'acc_credit_011', 'acc_credit_012'
      )
    `);
    console.log('✅ Fake accounts deleted');

    // Delete fake institutions
    console.log('🗑️ Deleting fake institutions...');
    await bigqueryDB.query(`
      DELETE FROM \`mymoney-470619.mymoney.institutions\`
      WHERE id IN ('inst_apple', 'inst_local_bank', 'inst_credit_union')
    `);
    console.log('✅ Fake institutions deleted');

    // Delete fake transactions
    console.log('🗑️ Deleting fake transactions...');
    await bigqueryDB.query(`
      DELETE FROM \`mymoney-470619.mymoney.transactions\`
      WHERE accountId IN (
        'acc_apple_card', 'acc_checking_001', 'acc_credit_001'
      )
    `);
    console.log('✅ Fake transactions deleted');

    console.log('🎉 All fake data cleaned up successfully!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupFakeData();
