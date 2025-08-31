import { bigqueryDB } from '../lib/bigquery';

interface RealAccount {
  id: string;
  displayName: string;
  institutionId: string;
  type: 'CARD';
  creditLimit: number;
  last4: string;
  closingDay: number;
}

const REAL_INSTITUTIONS = [
  { id: 'inst_mission_lane', name: 'Mission Lane', kind: 'BANK', createdAt: new Date().toISOString() },
  { id: 'inst_creditone', name: 'CreditOne Bank', kind: 'BANK', createdAt: new Date().toISOString() },
  { id: 'inst_capital_one', name: 'Capital One', kind: 'BANK', createdAt: new Date().toISOString() },
  { id: 'inst_fib', name: 'FIB', kind: 'BANK', createdAt: new Date().toISOString() },
  { id: 'inst_apple', name: 'Apple', kind: 'BANK', createdAt: new Date().toISOString() },
  { id: 'inst_amazon', name: 'Amazon', kind: 'BANK', createdAt: new Date().toISOString() },
  { id: 'inst_chase', name: 'Chase Bank', kind: 'BANK', createdAt: new Date().toISOString() }
];

const REAL_ACCOUNTS: RealAccount[] = [
  { id: 'acc_mission_lane_3967', displayName: 'Mission Lane Card', institutionId: 'inst_mission_lane', type: 'CARD', creditLimit: 4400, last4: '3967', closingDay: 17 },
  { id: 'acc_creditone_6922', displayName: 'CreditOne Card', institutionId: 'inst_creditone', type: 'CARD', creditLimit: 1250, last4: '6922', closingDay: 17 },
  { id: 'acc_creditone_3153', displayName: 'CreditOne Card', institutionId: 'inst_creditone', type: 'CARD', creditLimit: 1700, last4: '3153', closingDay: 17 },
  { id: 'acc_creditone_1501', displayName: 'CreditOne Card', institutionId: 'inst_creditone', type: 'CARD', creditLimit: 1050, last4: '1501', closingDay: 17 },
  { id: 'acc_capital_8662', displayName: 'Capital One Card', institutionId: 'inst_capital_one', type: 'CARD', creditLimit: 1250, last4: '8662', closingDay: 20 },
  { id: 'acc_capital_0010', displayName: 'Capital One Card', institutionId: 'inst_capital_one', type: 'CARD', creditLimit: 1750, last4: '0010', closingDay: 20 },
  { id: 'acc_fib_1057', displayName: 'FIB Card', institutionId: 'inst_fib', type: 'CARD', creditLimit: 1000, last4: '1057', closingDay: 17 },
  { id: 'acc_apple_card', displayName: 'Apple Card', institutionId: 'inst_apple', type: 'CARD', creditLimit: 1000, last4: '', closingDay: 30 },
  { id: 'acc_amazon_5856', displayName: 'Amazon Store Card', institutionId: 'inst_amazon', type: 'CARD', creditLimit: 450, last4: '5856', closingDay: 17 },
  { id: 'acc_chase_5725', displayName: 'Chase Visa', institutionId: 'inst_chase', type: 'CARD', creditLimit: 1000, last4: '5725', closingDay: 17 }
];

async function createRealInstitutions() {
  console.log('🏦 Creating real institutions...');
  
  for (const institution of REAL_INSTITUTIONS) {
    try {
      await bigqueryDB.upsert('institutions', institution.id, institution);
      console.log(`✅ Created institution: ${institution.name}`);
    } catch (error) {
      console.log(`⚠️ Institution ${institution.name} already exists or error:`, error);
    }
  }
}

async function createRealAccounts() {
  console.log('💳 Creating real accounts...');
  
  for (const account of REAL_ACCOUNTS) {
    try {
      const accountData = {
        id: account.id,
        displayName: account.displayName,
        institutionId: account.institutionId,
        type: account.type,
        creditLimit: account.creditLimit,
        last4: account.last4,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await bigqueryDB.upsert('accounts', account.id, accountData);
      console.log(`✅ Created account: ${account.displayName} (${account.last4}) - $${account.creditLimit} limit`);
    } catch (error) {
      console.log(`⚠️ Account ${account.displayName} already exists or error:`, error);
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting creation of real financial data...');
    
    await createRealInstitutions();
    await createRealAccounts();
    
    console.log('🎉 All real accounts and institutions created successfully!');
    
    // Verify the data
    console.log('\n📊 Verifying created data...');
    const accounts = await bigqueryDB.query(`
      SELECT 
        a.id,
        a.displayName,
        a.creditLimit,
        a.last4,
        i.name as institutionName
      FROM \`mymoney-470619.mymoney.accounts\` a
      JOIN \`mymoney-470619.mymoney.institutions\` i ON a.institutionId = i.id
      ORDER BY a.displayName
    `);
    
    console.log('\n📋 Created Accounts:');
    accounts.forEach((account: any) => {
      console.log(`  ${account.institutionName} - ${account.displayName} (${account.last4}) - $${account.creditLimit} limit`);
    });
    
  } catch (error) {
    console.error('❌ Error creating real data:', error);
  }
}

main();
