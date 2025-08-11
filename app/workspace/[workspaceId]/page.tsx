'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { setupWorkspaceSchema } from '@/lib/supabase/setup';
import { useWorkspaceActivity } from '@/hooks/useWorkspaceActivity';
import { UserActivityIndicator, UserProfileCard } from '@/components/UserActivityIndicator';
import { FileUploadDialog } from '@/components/file-upload-dialog';
import { FinanceSummaryCards } from '@/components/finance-summary-cards';
import { TransactionsTable } from '@/components/transactions-table';
import { createClient } from '@/lib/supabase/client';
import { getUserColor } from '@/lib/transaction-categorizer';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  uploaded_by: string;
  user_color?: string;
  created_at: string;
}

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

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  
  const [schemaReady, setSchemaReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [financeData, setFinanceData] = useState<FinanceSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use the consolidated activity hook
  const {
    session,
    userName,
    onlineUsers,
    isOnline,
    updateUserName,
    exitWorkspace,
  } = useWorkspaceActivity(workspaceId, schemaReady);

  // Fetch transactions and calculate finance data
  const fetchFinanceData = useCallback(async () => {
    if (!schemaReady) return;
    
    try {
      const supabase = createClient();
      
      // Fetch all transactions for this workspace
      const { data: transactionItems, error } = await supabase
        .from('workspace_items')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('item_type', 'transaction')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data for display
      const processedTransactions = transactionItems?.map(item => ({
        id: item.id,
        date: item.transaction_data.date,
        description: item.transaction_data.description,
        amount: item.transaction_data.amount,
        category: item.transaction_data.category,
        type: item.transaction_data.type,
        uploaded_by: item.uploaded_by,
        user_color: item.transaction_data.user_color,
        created_at: item.created_at
      })) || [];
      
      setTransactions(processedTransactions);
      
      // Calculate summary data
      const contributors: { [key: string]: { name: string; color: string; income: number; expenses: number } } = {};
      let totalIncome = 0;
      let totalExpenses = 0;
      let incomeCount = 0;
      let expenseCount = 0;
      
      // Build contributors map from online users and transaction uploaders
      [...onlineUsers, { user_session: session, user_name: userName }].forEach(user => {
        if (user.user_session && !contributors[user.user_session]) {
          contributors[user.user_session] = {
            name: user.user_name || 'Anonymous',
            color: getUserColor(user.user_session),
            income: 0,
            expenses: 0
          };
        }
      });
      
      // Process transactions for summary
      processedTransactions.forEach(transaction => {
        const amount = transaction.amount;
        const contributor = contributors[transaction.uploaded_by];
        
        if (transaction.type === 'income') {
          totalIncome += amount;
          incomeCount++;
          if (contributor) contributor.income += amount;
        } else {
          totalExpenses += amount;
          expenseCount++;
          if (contributor) contributor.expenses += amount;
        }
        
        // Ensure contributor exists
        if (!contributor && transaction.uploaded_by) {
          contributors[transaction.uploaded_by] = {
            name: 'Unknown User',
            color: getUserColor(transaction.uploaded_by),
            income: transaction.type === 'income' ? amount : 0,
            expenses: transaction.type === 'expense' ? amount : 0
          };
        }
      });
      
      setFinanceData({
        totalBalance: totalIncome - totalExpenses,
        monthlyIncome: { amount: totalIncome, count: incomeCount },
        monthlyExpenses: { amount: totalExpenses, count: expenseCount },
        contributors
      });
      
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  }, [schemaReady, workspaceId, onlineUsers, session, userName]);

  useEffect(() => {
    // Check if database schema is set up
    setupWorkspaceSchema().then((result) => {
      if (result.success) {
        setSchemaReady(true);
      } else {
        setDbError(result.error);
      }
    });
  }, []);

  useEffect(() => {
    if (schemaReady) {
      fetchFinanceData();
    }
  }, [schemaReady, onlineUsers]);

  // Set up real-time subscription for transaction updates
  useEffect(() => {
    if (!schemaReady) return;
    
    const supabase = createClient();
    const channel = supabase
      .channel(`workspace-transactions-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_items',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          fetchFinanceData(); // Refresh data when transactions change
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [schemaReady, workspaceId]);

  const copyWorkspaceUrl = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const handleExitWorkspace = async () => {
    await exitWorkspace();
    router.push('/');
  };

  if (!schemaReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          {!dbError ? (
            <>
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <div>
                <p className="font-semibold">Setting up workspace...</p>
                <p className="text-sm text-muted-foreground">
                  Checking database schema
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl mb-4">⚠️</div>
              <div>
                <p className="font-semibold text-red-600 mb-2">Database Setup Required</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {dbError}
                </p>
                <div className="text-left bg-muted p-4 rounded text-xs space-y-2">
                  <p className="font-semibold">Setup Steps:</p>
                  <p>1. Go to your Supabase dashboard → SQL Editor</p>
                  <p>2. Copy and run the contents of <code>supabase-setup.sql</code></p>
                  <p>3. Refresh this page</p>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded text-sm"
                >
                  Refresh Page
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Activity Indicator */}
        <UserActivityIndicator
          currentSession={session}
          onlineUsers={onlineUsers}
          isOnline={isOnline}
          onCopyWorkspaceUrl={copyWorkspaceUrl}
          onExitWorkspace={handleExitWorkspace}
        />

        {/* Workspace Info */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">💰 Finance Workspace</h1>
            <p className="text-sm text-muted-foreground">
              Collaborative financial tracking • {workspaceId}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <UserProfileCard
              session={session}
              userName={userName}
              isOnline={isOnline}
              onUpdateUserName={updateUserName}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {/* Finance Summary Cards */}
            {financeData && (
              <FinanceSummaryCards data={financeData} />
            )}

            {/* File Upload Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TransactionsTable 
                  transactions={transactions}
                  contributors={financeData?.contributors || {}}
                />
              </div>
              
              <div className="space-y-4">
                <FileUploadDialog
                  workspaceId={workspaceId}
                  userSession={session}
                  onTransactionsUploaded={fetchFinanceData}
                />
                
                {/* Instructions */}
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2 text-sm">💡 How it works</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Share this URL with your partner or family</li>
                    <li>• Everyone can upload their bank statements</li>
                    <li>• Transactions are automatically categorized</li>
                    <li>• See combined financial insights in real-time</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}