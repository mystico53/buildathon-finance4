'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/transaction-categorizer';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface FinanceSummaryData {
  totalBalance: number;
  monthlyIncome: {
    amount: number;
    count: number;
  };
  monthlyExpenses: {
    amount: number;
    count: number;
  };
  contributors: {
    [userSession: string]: {
      name: string;
      color: string;
      income: number;
      expenses: number;
    };
  };
}

interface FinanceSummaryCardsProps {
  data: FinanceSummaryData;
}

export function FinanceSummaryCards({ data }: FinanceSummaryCardsProps) {
  const { totalBalance, monthlyIncome, monthlyExpenses, contributors } = data;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Balance Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <span className={totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(totalBalance)}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(contributors).map(([session, contributor]) => (
              <Badge
                key={session}
                variant="secondary"
                className="text-xs"
                style={{ backgroundColor: contributor.color + '20', color: contributor.color }}
              >
                {contributor.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Income Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(monthlyIncome.amount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {monthlyIncome.count} transaction{monthlyIncome.count !== 1 ? 's' : ''}
          </p>
          <div className="mt-2 space-y-1">
            {Object.entries(contributors).map(([session, contributor]) => (
              contributor.income > 0 && (
                <div key={session} className="flex justify-between text-xs">
                  <span style={{ color: contributor.color }}>
                    {contributor.name}
                  </span>
                  <span className="text-green-600">
                    {formatCurrency(contributor.income)}
                  </span>
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Expenses Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(monthlyExpenses.amount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {monthlyExpenses.count} transaction{monthlyExpenses.count !== 1 ? 's' : ''}
          </p>
          <div className="mt-2 space-y-1">
            {Object.entries(contributors).map(([session, contributor]) => (
              contributor.expenses > 0 && (
                <div key={session} className="flex justify-between text-xs">
                  <span style={{ color: contributor.color }}>
                    {contributor.name}
                  </span>
                  <span className="text-red-600">
                    {formatCurrency(contributor.expenses)}
                  </span>
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}