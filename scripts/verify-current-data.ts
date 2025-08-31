import { bigqueryDB } from '../lib/bigquery';

async function verifyCurrentData() {
  try {
    console.log('🔍 Verifying current database state...\n');
    
    // Check institutions
    console.log('🏦 INSTITUTIONS:');
    const institutions = await bigqueryDB.query(`
      SELECT id, name, kind, createdAt
      FROM \`mymoney-470619.mymoney.institutions\`
      ORDER BY name
    `);
    
    institutions.forEach((inst: any) => {
      console.log(`  ${inst.id}: ${inst.name} (${inst.kind})`);
    });
    
    console.log(`\nTotal institutions: ${institutions.length}\n`);
    
    // Check accounts
    console.log('💳 ACCOUNTS:');
    const accounts = await bigqueryDB.query(`
      SELECT 
        a.id,
        a.displayName,
        a.creditLimit,
        a.last4,
        a.type,
        i.name as institutionName
      FROM \`mymoney-470619.mymoney.accounts\` a
      JOIN \`mymoney-470619.mymoney.institutions\` i ON a.institutionId = i.id
      ORDER BY i.name, a.displayName
    `);
    
    accounts.forEach((acc: any) => {
      const limit = acc.creditLimit ? `$${acc.creditLimit}` : 'No limit';
      console.log(`  ${acc.id}: ${acc.displayName} (${acc.last4}) - ${limit} - ${acc.institutionName}`);
    });
    
    console.log(`\nTotal accounts: ${accounts.length}\n`);
    
    // Check statements
    console.log('📄 STATEMENTS:');
    const statements = await bigqueryDB.query(`
      SELECT COUNT(*) as count
      FROM \`mymoney-470619.mymoney.statements\`
    `);
    
    console.log(`Total statements: ${statements[0].count}\n`);
    
  } catch (error) {
    console.error('❌ Error verifying data:', error);
  }
}

verifyCurrentData();
