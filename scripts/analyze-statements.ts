import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';

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
}

// Map statement filenames to account information
const ACCOUNT_MAPPINGS: { [key: string]: AccountMapping } = {
  'Apple Card Statement - July 2025.pdf': {
    name: 'Apple Card',
    id: 'acc_apple_card',
    type: 'CARD'
  },
  '2025-08-03.pdf': {
    name: 'Checking Account',
    id: 'acc_checking_001',
    type: 'CHECKING'
  },
  '2025-08-17.pdf': {
    name: 'Checking Account',
    id: 'acc_checking_001',
    type: 'CHECKING'
  },
  '2025-08-22.pdf': {
    name: 'Checking Account',
    id: 'acc_checking_001',
    type: 'CHECKING'
  },
  'Aug+5,+2025.pdf': {
    name: 'Credit Card',
    id: 'acc_credit_001',
    type: 'CARD'
  },
  'Statement_082025_0010.pdf': {
    name: 'Credit Card',
    id: 'acc_credit_002',
    type: 'CARD'
  },
  'Statement_082025_8662.pdf': {
    name: 'Credit Card',
    id: 'acc_credit_003',
    type: 'CARD'
  },
  '20250817-statements-5725-.pdf': {
    name: 'Credit Card',
    id: 'acc_credit_004',
    type: 'CARD'
  },
  'statement-02761873259-7PIA7CeUwC.pdf': {
    name: 'Credit Card',
    id: 'acc_credit_005',
    type: 'CARD'
  },
  '62ec70db-db68-4fd5-9a3f-3a672cc8e4a5.pdf': {
    name: 'Credit Card',
    id: 'acc_credit_006',
    type: 'CARD'
  },
  'b84afe92-d742-44ef-883a-38d6578e91a1.pdf': {
    name: 'Credit Card',
    id: 'acc_credit_007',
    type: 'CARD'
  },
  '6d3c8e2b-c2bf-44cc-a8fb-3d1d2e8e0d0c.pdf': {
    name: 'Credit Card',
    id: 'acc_credit_008',
    type: 'CARD'
  },
  'D__websites_COWWW4_wwwcache_V_1699_130_859363037_FISCanton_STMT.pdf': {
    name: 'Credit Card',
    id: 'acc_credit_009',
    type: 'CARD'
  }
};

async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error(`Error extracting text from ${filePath}:`, error);
    return '';
  }
}

function extractStatementData(text: string, filename: string): Partial<StatementData> | null {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Common patterns to look for
  const patterns = {
    balance: /(?:balance|amount|total|new balance|statement balance|current balance|ending balance)[\s:]*\$?([\d,]+\.?\d*)/i,
    minPayment: /(?:minimum payment|min payment|payment due|payment amount)[\s:]*\$?([\d,]+\.?\d*)/i,
    dueDate: /(?:due date|payment due date|due by|payment due)[\s:]*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i,
    closeDate: /(?:closing date|statement date|billing date|closing)[\s:]*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i,
    periodStart: /(?:billing period|statement period|period from|from)[\s:]*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i,
    periodEnd: /(?:to|through|ending)[\s:]*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i
  };

  let extractedData: Partial<StatementData> = {};
  
  // Extract balance
  for (const line of lines) {
    const balanceMatch = line.match(patterns.balance);
    if (balanceMatch && !extractedData.newBalance) {
      extractedData.newBalance = parseFloat(balanceMatch[1].replace(/,/g, ''));
      break;
    }
  }

  // Extract minimum payment
  for (const line of lines) {
    const minPaymentMatch = line.match(patterns.minPayment);
    if (minPaymentMatch && !extractedData.minPayment) {
      extractedData.minPayment = parseFloat(minPaymentMatch[1].replace(/,/g, ''));
      break;
    }
  }

  // Extract dates
  for (const line of lines) {
    // Due date
    if (!extractedData.dueDate) {
      const dueDateMatch = line.match(patterns.dueDate);
      if (dueDateMatch) {
        extractedData.dueDate = parseDate(dueDateMatch[1]);
      }
    }

    // Close date
    if (!extractedData.closeDate) {
      const closeDateMatch = line.match(patterns.closeDate);
      if (closeDateMatch) {
        extractedData.closeDate = parseDate(closeDateMatch[1]);
      }
    }

    // Period start
    if (!extractedData.periodStart) {
      const periodStartMatch = line.match(patterns.periodStart);
      if (periodStartMatch) {
        extractedData.periodStart = parseDate(periodStartMatch[1]);
      }
    }

    // Period end
    if (!extractedData.periodEnd) {
      const periodEndMatch = line.match(patterns.periodEnd);
      if (periodEndMatch) {
        extractedData.periodEnd = parseDate(periodEndMatch[1]);
      }
    }
  }

  // If we couldn't extract dates, try to infer from filename
  if (!extractedData.periodStart || !extractedData.periodEnd) {
    const dateFromFilename = extractDateFromFilename(filename);
    if (dateFromFilename) {
      if (!extractedData.periodStart) {
        extractedData.periodStart = dateFromFilename;
      }
      if (!extractedData.periodEnd) {
        extractedData.periodEnd = dateFromFilename;
      }
      if (!extractedData.closeDate) {
        extractedData.closeDate = dateFromFilename;
      }
    }
  }

  // If we still don't have required dates, use current date as fallback
  const now = new Date();
  if (!extractedData.periodStart) {
    extractedData.periodStart = now.toISOString();
  }
  if (!extractedData.periodEnd) {
    extractedData.periodEnd = now.toISOString();
  }
  if (!extractedData.closeDate) {
    extractedData.closeDate = now.toISOString();
  }

  return extractedData;
}

function parseDate(dateStr: string): string {
  try {
    // Try different date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    // Try parsing common formats
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
      /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/ // Month DD, YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format.source.includes('YYYY')) {
          // MM/DD/YYYY or YYYY-MM-DD
          const month = parseInt(match[1]) - 1;
          const day = parseInt(match[2]);
          const year = parseInt(match[3]);
          return new Date(year, month, day).toISOString();
        } else {
          // Month DD, YYYY
          const month = new Date(Date.parse(match[1] + " 1, 2000")).getMonth();
          const day = parseInt(match[2]);
          const year = parseInt(match[3]);
          return new Date(year, month, day).toISOString();
        }
      }
    }

    return new Date().toISOString();
  } catch (error) {
    console.error(`Error parsing date: ${dateStr}`, error);
    return new Date().toISOString();
  }
}

function extractDateFromFilename(filename: string): string | null {
  // Look for date patterns in filename
  const datePatterns = [
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /(\d{4})(\d{2})(\d{2})/,   // YYYYMMDD
    /(\d{1,2})\+(\d{1,2}),\+(\d{4})/, // M+D,+YYYY
  ];

  for (const pattern of datePatterns) {
    const match = filename.match(pattern);
    if (match) {
      if (pattern.source.includes('YYYY')) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const day = parseInt(match[3]);
        return new Date(year, month, day).toISOString();
      }
    }
  }

  return null;
}

async function analyzeStatements(): Promise<StatementData[]> {
  const statementsDir = path.join(process.cwd(), 'steatments');
  const files = fs.readdirSync(statementsDir).filter(file => file.endsWith('.pdf'));
  
  const statements: StatementData[] = [];
  
  for (const file of files) {
    const filePath = path.join(statementsDir, file);
    const accountMapping = ACCOUNT_MAPPINGS[file];
    
    if (!accountMapping) {
      console.warn(`No account mapping found for ${file}`);
      continue;
    }

    console.log(`Analyzing ${file}...`);
    
    try {
      const text = await extractTextFromPDF(filePath);
      if (!text) {
        console.warn(`No text extracted from ${file}`);
        continue;
      }

      const extractedData = extractStatementData(text, file);
      if (!extractedData) {
        console.warn(`Could not extract data from ${file}`);
        continue;
      }

      // Create statement record
      const statement: StatementData = {
        id: `stmt_${uuidv4()}`,
        accountId: accountMapping.id,
        periodStart: extractedData.periodStart!,
        periodEnd: extractedData.periodEnd!,
        closeDate: extractedData.closeDate!,
        dueDate: extractedData.dueDate,
        newBalance: extractedData.newBalance || 0,
        minPayment: extractedData.minPayment || 0,
        pdfPath: `steatments/${file}`,
        parsedBy: 'pdf-analyzer',
        createdAt: new Date().toISOString()
      };

      statements.push(statement);
      console.log(`✓ Extracted data from ${file}:`, {
        balance: statement.newBalance,
        minPayment: statement.minPayment,
        closeDate: statement.closeDate,
        dueDate: statement.dueDate
      });

    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  return statements;
}

async function main() {
  try {
    console.log('Starting statement analysis...');
    const statements = await analyzeStatements();
    
    console.log(`\nAnalysis complete! Found ${statements.length} statements.`);
    
    // Save to JSON file for review
    const outputPath = path.join(process.cwd(), 'extracted-statements.json');
    fs.writeFileSync(outputPath, JSON.stringify(statements, null, 2));
    console.log(`\nExtracted data saved to: ${outputPath}`);
    
    // Display summary
    console.log('\nStatement Summary:');
    statements.forEach(stmt => {
      const account = Object.values(ACCOUNT_MAPPINGS).find(acc => acc.id === stmt.accountId);
      console.log(`- ${account?.name || 'Unknown'}: $${stmt.newBalance} (Min: $${stmt.minPayment})`);
    });

  } catch (error) {
    console.error('Error in main:', error);
  }
}

if (require.main === module) {
  main();
}

export { analyzeStatements, StatementData };
