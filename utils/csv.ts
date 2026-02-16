import { Transaction, MonthYear } from '../types';

// Helper to parse a CSV line correctly handling quotes
const parseCSVLine = (text: string): string[] => {
  const row: string[] = [];
  let inQuote = false;
  let currentCell = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (i + 1 < text.length && text[i + 1] === '"') {
        currentCell += '"'; // Handle escaped quotes
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (char === ',' && !inQuote) {
      row.push(currentCell.trim());
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  row.push(currentCell.trim());
  return row;
};

export const parseCSV = (csvText: string): Transaction[] => {
  if (csvText.trim().toLowerCase().startsWith('<!doctype html') || csvText.includes('<html')) {
    throw new Error("Link error. Please ensure the Sheet is 'Public' or 'Anyone with the link'.");
  }

  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const processedTransactions: Transaction[] = [];
  
  // COLUMN-BASED CONTEXT
  // We map each column index to a specific Month/Year context.
  // This allows side-by-side months (e.g. Jan in Col A, Feb in Col E) to be tracked independently.
  const columnContexts: Record<number, { month: number, year: number }> = {};
  
  const headerRegex = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\-'’]+(\d{2,4})/i;

  lines.forEach((line, lineIndex) => {
    const row = parseCSVLine(line).map(c => c.replace(/^"|"$/g, '').trim());
    
    // Pass 1: Scan for Headers to update context
    for (let col = 0; col < row.length; col++) {
        const cell = row[col];
        const match = cell.match(headerRegex);
        
        // Basic heuristic to ensure it's a header and not a transaction description with a date
        // Headers are usually short and don't contain currency symbols
        if (match && cell.length < 25 && !cell.includes('$')) {
            const monthStr = match[1].toLowerCase();
            let year = parseInt(match[2]);
            if (year < 100) year += 2000;

            const d = new Date(`${monthStr} 1, 2000`);
            const month = d.getMonth();

            if (!isNaN(month) && !isNaN(year)) {
                // We found a header!
                // Apply this context to this column and the next few columns (The "Block")
                // A spread of 8 columns usually covers Description, Category, Type, Amount, etc.
                const BLOCK_WIDTH = 8; 
                for (let k = 0; k < BLOCK_WIDTH; k++) {
                    columnContexts[col + k] = { month, year };
                }
            }
        }
    }

    // Pass 2: Scan for "Current Balance" or Data using the current row's context
    for (let col = 0; col < row.length; col++) {
        const cell = row[col];
        const cellLower = cell.toLowerCase();

        // Check for Balance
        if (cellLower.includes('current balance')) {
            const ctx = columnContexts[col];
            
            if (ctx) {
                // Find the value in the subsequent columns
                let amount = 0;
                let found = false;
                
                // Scan to the right for the number
                for (let k = 1; k < 10; k++) {
                    if (col + k >= row.length) break;
                    
                    const valStr = row[col + k].replace(/[$£€,\s]/g, '');
                    // Must be a valid number
                    if (valStr !== '' && !isNaN(Number(valStr))) {
                        amount = parseFloat(valStr);
                        found = true;
                        break; 
                    }
                }

                if (found) {
                     processedTransactions.push({
                        id: `bal-${ctx.year}-${ctx.month}-${lineIndex}-${col}`, // Unique ID per month/row/col
                        date: new Date(ctx.year, ctx.month, 1).toISOString(),
                        description: 'Current Balance',
                        category: 'Balance',
                        amount: Math.abs(amount),
                        sheetBalance: amount, 
                        type: amount >= 0 ? 'income' : 'expense',
                        originalRow: { raw: line }
                    });
                }
            }
        }
        
        // OPTIONAL: Capture regular transaction rows for the "Data" table
        // Heuristic: Column has context, Cell has text, Next cell has number
        // We only do this if we didn't just find a balance
        else if (cell.length > 2 && !cellLower.includes('date') && !cellLower.includes('amount') && isNaN(Number(cell.replace(/[$£€,\s]/g, '')))) {
             const ctx = columnContexts[col];
             if (ctx) {
                 // Check immediate right for amount (standard layout)
                 // or scan a bit if there is a gap
                 let val = 0;
                 let foundVal = false;
                 
                 for (let k = 1; k < 4; k++) {
                    if (col + k >= row.length) break;
                    const possibleAmt = row[col + k].replace(/[$£€,\s]/g, '');
                    if (possibleAmt !== '' && !isNaN(Number(possibleAmt))) {
                        val = parseFloat(possibleAmt);
                        foundVal = true;
                        break;
                    }
                 }

                 if (foundVal) {
                     processedTransactions.push({
                        id: `tx-${lineIndex}-${col}`,
                        date: new Date(ctx.year, ctx.month, 1).toISOString(),
                        description: cell, // The text in the current cell
                        category: 'General',
                        amount: Math.abs(val),
                        type: val < 0 ? 'expense' : 'income',
                        originalRow: { raw: line }
                    });
                 }
             }
        }
    }
  });
  
  // Deduplicate: If multiple "Current Balance" rows were found for the same month (unlikely with this logic but possible),
  // we usually rely on the last one. The `calculateMonthlyStats` handles picking the valid balance.
  return processedTransactions;
};

// Expanded range to support past and future years (2024 - 2030)
export const getFixedMonthRange = (): MonthYear[] => {
    const months: MonthYear[] = [];
    let currentYear = 2024;
    let currentMonth = 0; // Jan
    
    // Generate up to Dec 2030
    while (currentYear < 2030 || (currentYear === 2030 && currentMonth <= 11)) {
        months.push({
            month: currentMonth,
            year: currentYear,
            label: new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        });
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
    }
    return months.reverse();
};

export const calculateMonthlyStats = (transactions: Transaction[], month: number, year: number) => {
    // 1. Filter all data for this specific month context
    const monthlyData = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    // 2. Find the Balance Row
    // If multiple balance rows exist for a month, we take the one with the highest index (processed last), which is usually the bottom-most one in the sheet.
    // Our ID generation `bal-${year}-${month}-${lineIndex}-${col}` ensures we can distinguish them.
    const balanceRows = monthlyData.filter(t => t.sheetBalance !== undefined);
    
    // Sort by original line index to ensure we get the bottom-most balance
    balanceRows.sort((a, b) => {
        // ID format: bal-YYYY-MM-LINE-COL
        const partsA = a.id.split('-');
        const partsB = b.id.split('-');
        const lineA = parseInt(partsA[3] || '0');
        const lineB = parseInt(partsB[3] || '0');
        return lineA - lineB;
    });

    const balanceRow = balanceRows.length > 0 ? balanceRows[balanceRows.length - 1] : null;
    
    // 3. The balance to display
    const currentBalance = balanceRow ? balanceRow.sheetBalance! : 0;

    return {
        stats: {
            totalBalance: currentBalance,
            totalIncome: 0, 
            totalExpense: 0,
            transactionCount: monthlyData.length
        },
        filteredData: monthlyData
    };
};