import { bigqueryDB } from '../lib/bigquery';
import * as fs from 'fs';
import * as path from 'path';

interface StatementData {
  id: string;
  accountId: string;
  periodStart: string;
  periodEnd: string;
  closeDate: string;
  dueDate?: string;
  newBalance: number;
  minPayment: number;
  pdfPath: string;
  parsedBy: string;
  createdAt: string;
}

interface AccountMapping {
  name: string;
  id: string;
  type: string;
  institutionId: string;
}

// Account mappings with institution information
const ACCOUNT_MAPPINGS: { [key: string]: AccountMapping } = {
  'acc_apple_card': {
    name: 'Apple Card',
    id: 'acc_apple_card',
    type: 'CARD',
    institutionId: 'inst_apple'
  },
  'acc_checking_001': {
    name: 'Basic Checking Account',
    id: 'acc_checking_001',
    type: 'CHECKING',
    institutionId: 'inst_bank'
  },
  'acc_credit_001': {
    name: 'Credit Card Account 1',
    id: 'acc_credit_001',
    type: 'CARD',
    institutionId: 'inst_credit_union'
  },
  'acc_credit_002': {
    name: 'Credit Card Account 2',
    id: 'acc_credit_002',
    type: 'CARD',
    institutionId: 'inst_credit_union'
  },
  'acc_credit_003': {
    name: 'Credit Card Account 3',
    id: 'acc_credit_003',
    type: 'CARD',
    institutionId: 'inst_credit_union'
  },
  'acc_credit_004': {
    name: 'Credit Card Account 4',
    id: 'acc_credit_004',
    type: 'CARD',
    institutionId: 'inst_credit_union'
  },
  'acc_credit_005': {
    name: 'Credit Card Account 5',
    id: 'acc_credit_005',
    type: 'CARD',
    institutionId: 'inst_credit_union'
  },
  'acc_credit_006': {
    name: 'Credit Card Account 6',
    id: 'acc_credit_006',
    type: 'CARD',
    institutionId: 'inst_credit_union'
  },
  'acc_credit_007': {
    name: 'Credit Card Account 7',
    id: 'acc_credit_007',
    type: 'CARD',
    institutionId: 'inst_credit_union'
  },
  'acc_credit_008': {
    name: 'Credit Card Account 8',
    id: 'acc_credit_008',
    type: 'CARD',
    institutionId: 'inst_credit_union'
  },
  'acc_credit_009': {
    name: 'Credit Card Account 9',
    id: 'acc_credit_009',
    type: 'CARD',
    institutionId: 'inst_credit_union'
  }
};

// Institution definitions
const INSTITUTIONS = [
  {
    id: 'inst_apple',
    name: 'Apple',
    kind: 'FINANCIAL_SERVICES',
    website: 'https://www.apple.com',
    createdAt: new Date().toISOString()
  },
  {
    id: 'inst_bank',
    name: 'Local Bank',
    kind: 'BANK',
    website: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 'inst_credit_union',
    name: 'Credit Union',
    kind: 'CREDIT_UNION',
    website: null,
    createdAt: new Date().toISOString()
  }
];

async function createInstitutions() {
  console.log('Creating institutions...');
  
  for (const institution of INSTITUTIONS) {
    try {
      await bigqueryDB.create('institutions', institution);
      console.log(`✓ Created institution: ${institution.name}`);
    } catch (error: any) {
      if (error.code === 409) {
        console.log(`- Institution ${institution.name} already exists`);
      } else {
        console.error(`Error creating institution ${institution.name}:`, error);
      }
    }
  }
}

async function createAccounts() {
  console.log('Creating accounts...');
  
  for (const accountMapping of Object.values(ACCOUNT_MAPPINGS)) {
    try {
      const accountData = {
        id: accountMapping.id,
        institutionId: accountMapping.institutionId,
        type: accountMapping.type,
        displayName: accountMapping.name,
        last4: null,
        currency: 'USD',
        openedAt: new Date().toISOString(),
        closedAt: null,
        creditLimit: accountMapping.type === 'CARD' ? 10000 : null,
        originalPrincipal: null,
        termMonths: null,
        secured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await bigqueryDB.create('accounts', accountData);
      console.log(`✓ Created account: ${accountMapping.name}`);
    } catch (error: any) {
      if (error.code === 409) {
        console.log(`- Account ${accountMapping.name} already exists`);
      } else {
        console.error(`Error creating account ${accountMapping.name}:`, error);
      }
    }
  }
}

async function insertStatements() {
  console.log('Inserting statements...');
  
  // Read the extracted statements
  const statementsPath = path.join(process.cwd(), 'extracted-statements.json');
  const statementsData = fs.readFileSync(statementsPath, 'utf8');
  const statements: StatementData[] = JSON.parse(statementsData);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const statement of statements) {
    try {
      // Convert the statement data to match BigQuery schema
      const statementRecord = {
        id: statement.id,
        accountId: statement.accountId,
        periodStart: statement.periodStart,
        periodEnd: statement.periodEnd,
        closeDate: statement.closeDate,
        dueDate: statement.dueDate || null,
        newBalance: statement.newBalance,
        minPayment: statement.minPayment,
        pdfPath: statement.pdfPath,
        parsedBy: statement.parsedBy,
        createdAt: statement.createdAt
      };

      await bigqueryDB.create('statements', statementRecord);
      successCount++;
      
      const account = ACCOUNT_MAPPINGS[statement.accountId];
      console.log(`✓ Inserted statement for ${account?.name || 'Unknown'}: $${statement.newBalance}`);
      
    } catch (error: any) {
      errorCount++;
      const account = ACCOUNT_MAPPINGS[statement.accountId];
      console.error(`✗ Error inserting statement for ${account?.name || 'Unknown'}:`, error.message);
    }
  }
  
  console.log(`\nStatement insertion complete:`);
  console.log(`- Successfully inserted: ${successCount}`);
  console.log(`- Errors: ${errorCount}`);
}

async function main() {
  try {
    console.log('Starting statement insertion process...\n');
    
    // Initialize BigQuery connection
    await bigqueryDB.initialize();
    console.log('BigQuery initialized successfully\n');
    
    // Create institutions first
    await createInstitutions();
    console.log('');
    
    // Create accounts
    await createAccounts();
    console.log('');
    
    // Insert statements
    await insertStatements();
    
    console.log('\n✅ All operations completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { createInstitutions, createAccounts, insertStatements };
