import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, Category, AppView, ChatMessage, TransactionType } from './types';
import { DEFAULT_CATEGORIES, ICON_MAP } from './constants';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import CategoryList from './components/CategoryList';
import ClaudiaChat from './components/ClaudiaChat';
import TransactionModal from './components/TransactionModal';
import { processUserMessage } from './services/geminiService';
import { LayoutDashboard, List, MessageSquare, Wallet, Plus, Download, Tags, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<TransactionType>('expense');

  // Persistence
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  // Handlers
  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleAddManualTransaction = (data: { description: string; amount: number; type: TransactionType; categoryId: string; date: string }) => {
    const newTransaction: Transaction = {
      id: uuidv4(),
      ...data
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const handleOpenTransactionModal = (type: TransactionType = 'expense') => {
    setModalInitialType(type);
    setIsTransactionModalOpen(true);
  };

  const handleCreateCategory = (data: { name: string; iconKey: string; color: string; type: TransactionType }) => {
    const newCategory: Category = {
      id: uuidv4(),
      name: data.name,
      iconKey: data.iconKey,
      color: data.color,
      type: data.type,
      isDefault: false
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const handleDeleteCategory = (id: string) => {
    if (categories.find(c => c.id === id)?.isDefault) {
      alert("Não é possível excluir categorias padrão.");
      return;
    }
    if (window.confirm('Tem certeza? Transações antigas manterão o ID mas a categoria não existirá mais.')) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleResetData = () => {
    if (window.confirm('ATENÇÃO: Isso apagará TODAS as suas transações e categorias personalizadas. Deseja continuar?')) {
      setTransactions([]);
      setCategories(DEFAULT_CATEGORIES);
      setChatMessages([]);
      localStorage.removeItem('transactions');
      localStorage.removeItem('categories');
      window.location.reload();
    }
  };

  const exportData = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => {
        const catName = categories.find(c => c.id === t.categoryId)?.name || 'Unknown';
        return `${t.date},"${t.description}",${catName},${t.type},${t.amount}`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'financas_pro_dados.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', content: text, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setIsProcessingAI(true);

    try {
      const result = await processUserMessage(text, categories, transactions);
      let responseText = "";

      switch (result.action) {
        case 'create_transaction':
          if (result.transactionData) {
            // Find category ID or default to Others
            const catName = result.transactionData.categoryName;
            let category = categories.find(c => c.name.toLowerCase() === catName?.toLowerCase());
            
            if (!category) {
                // Fallback logic
                const type = result.transactionData.type;
                category = categories.find(c => c.name === 'Outros' && c.type === type) || categories[0];
            }

            const newTransaction: Transaction = {
              id: uuidv4(),
              description: result.transactionData.description,
              amount: result.transactionData.amount,
              type: result.transactionData.type,
              categoryId: category.id,
              date: result.transactionData.date || new Date().toISOString().split('T')[0]
            };

            setTransactions(prev => [newTransaction, ...prev]);
            responseText = `Registrei "${newTransaction.description}" no valor de R$${newTransaction.amount} em ${category.name}.`;
          }
          break;

        case 'create_category':
          if (result.categoryData) {
            const iconKey = Object.keys(ICON_MAP).includes(result.categoryData.iconKey) 
              ? result.categoryData.iconKey 
              : 'MoreHorizontal';
            
            const newCategory: Category = {
              id: uuidv4(),
              name: result.categoryData.name,
              color: '#6366f1', // Default color for AI created
              iconKey: iconKey,
              type: 'expense', // Default to expense for safety
              isDefault: false
            };
            setCategories(prev => [...prev, newCategory]);
            responseText = `Categoria "${newCategory.name}" criada com sucesso!`;
          }
          break;

        case 'export_data':
          exportData();
          responseText = "Gerei o arquivo CSV com seus dados. O download deve começar automaticamente.";
          break;

        case 'answer_query':
          responseText = result.textResponse || "Aqui está o que você pediu.";
          break;

        default:
          responseText = result.textResponse || "Não consegui entender completamente. Pode reformular?";
      }

      const aiMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: responseText, timestamp: Date.now() };
      setChatMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      const errorMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: "Tive um erro de conexão. Tente novamente.", timestamp: Date.now() };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessingAI(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      
      <TransactionModal 
        isOpen={isTransactionModalOpen} 
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleAddManualTransaction}
        categories={categories}
        initialType={modalInitialType}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-md shadow-indigo-200">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 hidden sm:block">
              Finanças Pro
            </h1>
            <h1 className="text-xl font-bold text-indigo-600 sm:hidden">
              Claudia
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 mr-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sistema Online</span>
             </div>

             <button 
                onClick={exportData}
                title="Exportar CSV"
                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
             >
               <Download className="w-4 h-4" /> <span className="hidden lg:inline">Exportar</span>
             </button>

             <button 
                onClick={handleResetData}
                title="Limpar Dados (Reset)"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
             >
               <Trash2 className="w-4 h-4" />
             </button>

             <button
                onClick={() => handleOpenTransactionModal('expense')}
                className="flex md:hidden items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200 active:scale-90 transition-transform"
             >
               <Plus className="w-6 h-6" />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative">
        
        {/* Sidebar Nav (Desktop) / Top Tabs (Mobile) */}
        <nav className="lg:col-span-2 flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
          <button
            onClick={() => handleOpenTransactionModal('expense')}
            className="hidden lg:flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all mb-4"
          >
            <Plus className="w-5 h-5" /> Nova Transação
          </button>

          <button
            onClick={() => setView(AppView.DASHBOARD)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all shrink-0 ${
              view === AppView.DASHBOARD ? 'bg-white text-indigo-600 shadow-md ring-1 ring-indigo-50' : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button
            onClick={() => setView(AppView.TRANSACTIONS)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all shrink-0 ${
              view === AppView.TRANSACTIONS ? 'bg-white text-indigo-600 shadow-md ring-1 ring-indigo-50' : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <List className="w-5 h-5" /> Transações
          </button>
          <button
            onClick={() => setView(AppView.CATEGORIES)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all shrink-0 ${
              view === AppView.CATEGORIES ? 'bg-white text-indigo-600 shadow-md ring-1 ring-indigo-50' : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Tags className="w-5 h-5" /> Categorias
          </button>
          
          {/* "Ask Claudia" is prominent for mobile access too */}
          <button
            onClick={() => setView(AppView.CHAT)}
            className={`lg:hidden flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all shrink-0 ${
              view === AppView.CHAT ? 'bg-white text-indigo-600 shadow-md ring-1 ring-indigo-50' : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <MessageSquare className="w-5 h-5" /> Claudia AI
          </button>
        </nav>

        {/* Center Content */}
        <div className={`lg:col-span-7 ${view === AppView.CHAT ? 'hidden lg:block' : 'block'}`}>
          {view === AppView.DASHBOARD && (
            <Dashboard 
              transactions={transactions} 
              categories={categories} 
              onOpenTransactionModal={handleOpenTransactionModal}
            />
          )}
          {view === AppView.TRANSACTIONS && (
            <TransactionList 
              transactions={transactions} 
              categories={categories} 
              onDelete={handleDeleteTransaction} 
            />
          )}
          {view === AppView.CATEGORIES && (
            <CategoryList 
              categories={categories}
              onDelete={handleDeleteCategory}
              onCreate={handleCreateCategory}
            />
          )}
          {view === AppView.CHAT && (
             // Mobile only view for chat
             <div className="lg:hidden h-full">
                <ClaudiaChat messages={chatMessages} onSendMessage={handleSendMessage} isProcessing={isProcessingAI} />
             </div>
          )}
        </div>

        {/* Right Side - Chat (Always visible on Desktop) */}
        <div className={`lg:col-span-3 ${view === AppView.CHAT ? 'block w-full' : 'hidden lg:block'}`}>
          <div className="sticky top-24">
             <ClaudiaChat messages={chatMessages} onSendMessage={handleSendMessage} isProcessing={isProcessingAI} />
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;