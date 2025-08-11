'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Check } from 'lucide-react';
import Papa from 'papaparse';
import { categorizeTransaction, isIncomeTransaction, formatCurrency, getUserColor } from '@/lib/transaction-categorizer';

interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  auto_categorized: boolean;
  user_color: string;
}

interface FileUploadDialogProps {
  workspaceId: string;
  userSession: string;
  onTransactionsUploaded: () => void;
}

export function FileUploadDialog({ workspaceId, userSession, onTransactionsUploaded }: FileUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stage, setStage] = useState<'select' | 'preview' | 'uploading' | 'complete'>('select');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setStage('preview');
    
    Papa.parse(selectedFile, {
      header: true,
      complete: (results) => {
        const parsedTransactions: Transaction[] = (results.data as Record<string, string>[])
          .filter((row) => row.Date && row.Description && row.Amount)
          .map((row) => {
            const amount = parseFloat(row.Amount || row.amount || '0');
            const description = row.Description || row.description || '';
            const date = row.Date || row.date || '';
            
            const category = categorizeTransaction(description);
            const type = isIncomeTransaction(description, amount) ? 'income' : 'expense';
            const userColor = getUserColor(userSession);
            
            return {
              date,
              description,
              amount: Math.abs(amount), // Store as positive, type indicates income/expense
              category: category.name,
              type,
              auto_categorized: true,
              user_color: userColor
            };
          });
        
        setTransactions(parsedTransactions);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const uploadTransactions = async () => {
    if (!transactions.length) return;
    
    setStage('uploading');
    
    try {
      // Import Supabase client
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const totalTransactions = transactions.length;
      let uploaded = 0;
      
      // Upload transactions in batches
      const batchSize = 10;
      for (let i = 0; i < totalTransactions; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        
        const workspaceItems = batch.map(transaction => ({
          workspace_id: workspaceId,
          item_type: 'transaction',
          uploaded_by: userSession,
          transaction_data: transaction,
          content: {
            summary: `${transaction.type} - ${transaction.description}`
          }
        }));
        
        const { error } = await supabase
          .from('workspace_items')
          .insert(workspaceItems);
        
        if (error) {
          console.error('Upload error:', error);
          throw error;
        }
        
        uploaded += batch.length;
        setUploadProgress((uploaded / totalTransactions) * 100);
      }
      
      setStage('complete');
      setTimeout(() => {
        onTransactionsUploaded();
        setIsOpen(false);
        resetState();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to upload transactions:', error);
      setStage('preview');
    } finally {
      // Upload complete
    }
  };

  const resetState = () => {
    setTransactions([]);
    setUploadProgress(0);
    setStage('select');
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetState();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button className="w-full" onClick={() => setIsOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Bank Statement
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Bank Statement</DialogTitle>
          <DialogDescription>
            Upload a CSV file from your bank to automatically categorize and analyze your transactions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {stage === 'select' && (
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center space-y-4"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <FileText className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">Drop your CSV file here</h3>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}
          
          {stage === 'preview' && transactions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Preview Transactions</h3>
                  <p className="text-sm text-muted-foreground">
                    Found {transactions.length} transactions. Categories have been automatically assigned.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetState}>
                    Cancel
                  </Button>
                  <Button onClick={uploadTransactions}>
                    Upload {transactions.length} Transactions
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 50).map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-sm">{transaction.date}</TableCell>
                        <TableCell className="text-sm">{transaction.description}</TableCell>
                        <TableCell className="text-sm font-mono">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {transaction.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={transaction.type === 'income' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {transaction.type}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {transactions.length > 50 && (
                  <div className="p-4 text-center text-sm text-muted-foreground border-t">
                    Showing first 50 transactions. {transactions.length - 50} more will be uploaded.
                  </div>
                )}
              </div>
            </div>
          )}
          
          {stage === 'uploading' && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <h3 className="font-medium">Uploading Transactions</h3>
                <p className="text-sm text-muted-foreground">
                  Processing {transactions.length} transactions...
                </p>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {Math.round(uploadProgress)}% complete
              </p>
            </div>
          )}
          
          {stage === 'complete' && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <Check className="w-16 h-16 mx-auto text-green-500" />
                <h3 className="font-medium">Upload Complete!</h3>
                <p className="text-sm text-muted-foreground">
                  Successfully uploaded {transactions.length} transactions.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}