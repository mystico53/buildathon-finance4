'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, TRANSACTION_CATEGORIES } from '@/lib/transaction-categorizer';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  uploaded_by: string;
  user_name?: string;
  user_color?: string;
  created_at: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  contributors: { [key: string]: { name: string; color: string } };
}

export function TransactionsTable({ transactions, contributors }: TransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
            <p className="text-sm">Upload a bank statement to get started with transaction tracking.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCategoryEmoji = (categoryName: string) => {
    const category = TRANSACTION_CATEGORIES.find(cat => cat.name === categoryName);
    return category?.emoji || '📝';
  };

  const getCategoryColor = (categoryName: string) => {
    const category = TRANSACTION_CATEGORIES.find(cat => cat.name === categoryName);
    return category?.color || '#6b7280';
  };

  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Transactions</span>
          <Badge variant="secondary">{transactions.length} total</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Added by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.slice(0, 20).map((transaction) => {
                const contributor = contributors[transaction.uploaded_by];
                const categoryColor = getCategoryColor(transaction.category);
                
                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-sm">
                      {format(new Date(transaction.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                        style={{ 
                          backgroundColor: categoryColor + '20',
                          color: categoryColor 
                        }}
                      >
                        {getCategoryEmoji(transaction.category)} {transaction.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={transaction.type === 'income' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: contributor?.color || '#6b7280' }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {contributor?.name || 'Unknown'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {transactions.length > 20 && (
            <div className="p-4 text-center text-sm text-muted-foreground border-t">
              Showing 20 of {transactions.length} transactions
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}