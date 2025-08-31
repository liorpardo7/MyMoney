import { bigqueryDB } from '../lib/bigquery';

async function verifyStatements() {
  try {
    console.log('Verifying statements in BigQuery...\n');
    
    // Initialize BigQuery connection
    await bigqueryDB.initialize();
    
    // Query statements table
    const statements = await bigqueryDB.query(`
      SELECT 
        s.*,
        a.displayName as accountName,
        a.type as accountType,
        i.name as institutionName
      FROM \`mymoney.statements\` s
      JOIN \`mymoney.accounts\` a ON s.accountId = a.id
      JOIN \`mymoney.institutions\` i ON a.institutionId = i.id
      ORDER BY s.createdAt DESC
      LIMIT 20
    `);
    
    console.log(`Found ${statements.length} statements:\n`);
    
    statements.forEach((stmt: any, index: number) => {
      console.log(`${index + 1}. ${stmt.accountName} (${stmt.institutionName})`);
      console.log(`   Balance: $${stmt.newBalance.toFixed(2)}`);
      console.log(`   Min Payment: $${stmt.minPayment.toFixed(2)}`);
      console.log(`   Close Date: ${new Date(stmt.closeDate).toLocaleDateString()}`);
      if (stmt.dueDate) {
        console.log(`   Due Date: ${new Date(stmt.dueDate).toLocaleDateString()}`);
      }
      console.log(`   PDF: ${stmt.pdfPath}`);
      console.log('');
    });
    
    // Query accounts table
    const accounts = await bigqueryDB.query(`
      SELECT 
        a.*,
        i.name as institutionName,
        COUNT(s.id) as statementCount,
        SUM(s.newBalance) as totalBalance
      FROM \`mymoney.accounts\` a
      JOIN \`mymoney.institutions\` i ON a.institutionId = i.id
      LEFT JOIN \`mymoney.statements\` s ON a.id = s.accountId
      GROUP BY a.id, a.institutionId, a.type, a.displayName, a.last4, a.currency,
               a.openedAt, a.closedAt, a.creditLimit, a.originalPrincipal, a.termMonths,
               a.secured, a.createdAt, a.updatedAt, i.name
      ORDER BY a.createdAt DESC
    `);
    
    console.log(`\nAccount Summary (${accounts.length} accounts):\n`);
    
    accounts.forEach((acc: any, index: number) => {
      console.log(`${index + 1}. ${acc.displayName} (${acc.institutionName})`);
      console.log(`   Type: ${acc.type}`);
      console.log(`   Statements: ${acc.statementCount}`);
      if (acc.totalBalance !== null) {
        console.log(`   Total Balance: $${acc.totalBalance.toFixed(2)}`);
      }
      console.log('');
    });
    
    // Query institutions table
    const institutions = await bigqueryDB.query(`
      SELECT 
        i.*,
        COUNT(a.id) as accountCount
      FROM \`mymoney.institutions\` i
      LEFT JOIN \`mymoney.accounts\` a ON i.id = a.institutionId
      GROUP BY i.id, i.name, i.kind, i.website, i.createdAt
      ORDER BY i.createdAt DESC
    `);
    
    console.log(`\nInstitution Summary (${institutions.length} institutions):\n`);
    
    institutions.forEach((inst: any, index: number) => {
      console.log(`${index + 1}. ${inst.name} (${inst.kind})`);
      console.log(`   Accounts: ${inst.accountCount}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error verifying statements:', error);
  }
}

if (require.main === module) {
  verifyStatements();
}

export { verifyStatements };
