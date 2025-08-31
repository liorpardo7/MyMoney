import { bigqueryDB } from '../lib/bigquery';

async function addRealAccounts() {
  try {
    console.log('🚀 Adding your real credit card accounts...\n');
    
    // Add institutions first
    console.log('🏦 Adding institutions...');
    const institutions = [
      { id: 'inst_mission_lane', name: 'Mission Lane', kind: 'BANK', createdAt: new Date().toISOString() },
      { id: 'inst_creditone', name: 'CreditOne Bank', kind: 'BANK', createdAt: new Date().toISOString() },
      { id: 'inst_capital_one', name: 'Capital One', kind: 'BANK', createdAt: new Date().toISOString() },
      { id: 'inst_fib', name: 'FIB', kind: 'BANK', createdAt: new Date().toISOString() },
      { id: 'inst_apple', name: 'Apple', kind: 'BANK', createdAt: new Date().toISOString() },
      { id: 'inst_amazon', name: 'Amazon', kind: 'BANK', createdAt: new Date().toISOString() },
      { id: 'inst_chase', name: 'Chase Bank', kind: 'BANK', createdAt: new Date().toISOString() }
    ];
    
    for (const inst of institutions) {
      await bigqueryDB.query(`
        INSERT INTO \`mymoney-470619.mymoney.institutions\` (id, name, kind, createdAt)
        VALUES ('${inst.id}', '${inst.name}', '${inst.kind}', '${inst.createdAt}')
      `);
      console.log(`✅ Added institution: ${inst.name}`);
    }
    
    // Add accounts
    console.log('\n💳 Adding accounts...');
    const accounts = [
      { id: 'acc_mission_lane_3967', displayName: 'Mission Lane Card', institutionId: 'inst_mission_lane', creditLimit: 4400, last4: '3967' },
      { id: 'acc_creditone_6922', displayName: 'CreditOne Card', institutionId: 'inst_creditone', creditLimit: 1250, last4: '6922' },
      { id: 'acc_creditone_3153', displayName: 'CreditOne Card', institutionId: 'inst_creditone', creditLimit: 1700, last4: '3153' },
      { id: 'acc_creditone_1501', displayName: 'CreditOne Card', institutionId: 'inst_creditone', creditLimit: 1050, last4: '1501' },
      { id: 'acc_capital_8662', displayName: 'Capital One Card', institutionId: 'inst_capital_one', creditLimit: 1250, last4: '8662' },
      { id: 'acc_capital_0010', displayName: 'Capital One Card', institutionId: 'inst_capital_one', creditLimit: 1750, last4: '0010' },
      { id: 'acc_fib_1057', displayName: 'FIB Card', institutionId: 'inst_fib', creditLimit: 1000, last4: '1057' },
      { id: 'acc_apple_card', displayName: 'Apple Card', institutionId: 'inst_apple', creditLimit: 1000, last4: '' },
      { id: 'acc_amazon_5856', displayName: 'Amazon Store Card', institutionId: 'inst_amazon', creditLimit: 450, last4: '5856' },
      { id: 'acc_chase_5725', displayName: 'Chase Visa', institutionId: 'inst_chase', creditLimit: 1000, last4: '5725' }
    ];
    
    for (const acc of accounts) {
      await bigqueryDB.query(`
        INSERT INTO \`mymoney-470619.mymoney.accounts\` 
        (id, displayName, institutionId, type, creditLimit, last4, currency, createdAt, updatedAt)
        VALUES (
          '${acc.id}', 
          '${acc.displayName}', 
          '${acc.institutionId}', 
          'CARD', 
          ${acc.creditLimit}, 
          '${acc.last4}', 
          'USD', 
          '${new Date().toISOString()}', 
          '${new Date().toISOString()}'
        )
      `);
      console.log(`✅ Added account: ${acc.displayName} (${acc.last4}) - $${acc.creditLimit} limit`);
    }
    
    console.log('\n🎉 All accounts added successfully!');
    
    // Verify
    console.log('\n📊 Verifying data...');
    const result = await bigqueryDB.query(`
      SELECT 
        a.displayName,
        a.creditLimit,
        a.last4,
        i.name as institutionName
      FROM \`mymoney-470619.mymoney.accounts\` a
      JOIN \`mymoney-470619.mymoney.institutions\` i ON a.institutionId = i.id
      ORDER BY i.name, a.displayName
    `);
    
    console.log('\n📋 Your Credit Cards:');
    result.forEach((acc: any) => {
      const limit = acc.creditLimit ? `$${acc.creditLimit}` : 'No limit';
      const last4 = acc.last4 ? `(${acc.last4})` : '';
      console.log(`  ${acc.institutionName} - ${acc.displayName} ${last4} - ${limit}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding accounts:', error);
  }
}

addRealAccounts();
