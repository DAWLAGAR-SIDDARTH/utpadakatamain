import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Whiteboard } from './components/Whiteboard';
import { Dashboard } from './components/Dashboard';
import { ShareModal } from './components/ShareModal';
import { Button, Modal, Input, AppLogo } from './components/UIComponents';
import { BoardItem, ItemType, User, ViewMode, TaskPriority, WorkspaceState, Expense, ShareRole } from './types';
import { DEFAULT_NOTE_SIZE, DEFAULT_TASK_SIZE, DEFAULT_EXPENSE_SIZE, DEFAULT_GROUP_SIZE, NOTE_COLORS } from './constants';
import { Plus, Layout, StickyNote, CheckSquare, Sparkles, PieChart, Users, DollarSign, Folder, Settings, Moon, Sun, User as UserIcon, LogOut, Share2 } from 'lucide-react';
import { analyzeWorkspace } from './services/geminiService';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.BOARD);
  
  // Workspace State
  const [items, setItems] = useState<BoardItem[]>([]);
  const [globalExpenses, setGlobalExpenses] = useState<Expense[]>([]);
  const [viewState, setViewState] = useState({ scale: 1, offset: { x: 0, y: 0 } });
  
  // Permissions & Sharing
  const [userRole, setUserRole] = useState<ShareRole>('owner'); // owner, edit, comment, view
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  // UI State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Settings State
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Handle Dark Mode
  useEffect(() => {
    if (user?.preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.preferences.theme]);

  // Handle Login & Data Loading
  const handleLogin = async (userData: User) => {
    const loggedInUser = await storageService.loginUser(userData);
    setUser(loggedInUser);
    setEditName(loggedInUser.name);
    setEditAvatar(loggedInUser.avatar || '');

    const loadedItems = await storageService.loadWorkspace(loggedInUser.id);
    if (loadedItems.length > 0) {
      setItems(loadedItems);
    } else {
      // Seed initial items if empty
      setItems([
        {
          id: 'welcome-note',
          type: ItemType.NOTE,
          position: { x: 100, y: 100 },
          size: DEFAULT_NOTE_SIZE,
          zIndex: 1,
          content: `Welcome to your workspace, ${loggedInUser.name}!\n\nDrag to move.\nCtrl+Wheel to zoom.\nDouble click text to edit.`,
          color: NOTE_COLORS[0]
        }
      ]);
    }
    // Center view
    setViewState({ scale: 1, offset: { x: window.innerWidth / 2 - 400, y: window.innerHeight / 2 - 300 } });
  };

  // Auto-Save
  useEffect(() => {
    if (user && items.length > 0) {
      // Debounce save
      const timeout = setTimeout(() => {
        storageService.saveWorkspace(user.id, items);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [items, user]);

  // Sync widget expenses
  useEffect(() => {
    const allWidgetExpenses = items
      .filter(i => i.type === ItemType.EXPENSE_WIDGET)
      .flatMap((w: any) => w.expenses);
    if (allWidgetExpenses.length > 0) {
        setGlobalExpenses(allWidgetExpenses);
    }
  }, [items]);

  const addItem = (type: ItemType) => {
    if (userRole === 'view') return; // Read only check

    const centerWorldX = (window.innerWidth / 2 - viewState.offset.x) / viewState.scale;
    const centerWorldY = (window.innerHeight / 2 - viewState.offset.y) / viewState.scale;
    
    const id = Date.now().toString();
    const zIndex = items.length + 1;

    let newItem: BoardItem;

    if (type === ItemType.NOTE) {
      newItem = {
        id, type, zIndex,
        position: { x: centerWorldX - 120, y: centerWorldY - 120 },
        size: DEFAULT_NOTE_SIZE,
        content: '',
        color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
      };
    } else if (type === ItemType.TASK) {
      newItem = {
        id, type, zIndex,
        position: { x: centerWorldX - 150, y: centerWorldY - 90 },
        size: DEFAULT_TASK_SIZE,
        title: 'New Task',
        description: '',
        priority: TaskPriority.MEDIUM,
        completed: false
      };
    } else if (type === ItemType.EXPENSE_WIDGET) {
      newItem = {
        id, type, zIndex,
        position: { x: centerWorldX - 160, y: centerWorldY - 200 },
        size: DEFAULT_EXPENSE_SIZE,
        title: 'Project Budget',
        expenses: []
      } as any;
    } else {
        newItem = {
            id, type: ItemType.GROUP, zIndex: 0,
            position: { x: centerWorldX - 300, y: centerWorldY - 200 },
            size: DEFAULT_GROUP_SIZE,
            title: 'New Group',
            color: 'transparent'
        } as any;
    }

    setItems([...items, newItem]);
  };

  const runAiAnalysis = async () => {
    setAiModalOpen(true);
    setIsAiLoading(true);
    setAiAnalysis('');
    const result = await analyzeWorkspace(items, globalExpenses);
    setAiAnalysis(result);
    setIsAiLoading(false);
  };

  const saveProfile = () => {
    if (user) {
        const updated = { ...user, name: editName, avatar: editAvatar };
        setUser(updated);
        setSettingsModalOpen(false);
        storageService.loginUser(updated); // Sync update
    }
  };

  const toggleTheme = () => {
      if (user) {
          const newTheme: 'light' | 'dark' = user.preferences.theme === 'dark' ? 'light' : 'dark';
          const updated: User = { 
              ...user, 
              preferences: { 
                  ...user.preferences, 
                  theme: newTheme 
              } 
          };
          setUser(updated);
          storageService.loginUser(updated); // Sync update
      }
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // Permission Checks
  const canEdit = userRole === 'owner' || userRole === 'edit';
  const canComment = canEdit || userRole === 'comment';

  return (
    <div className="h-screen w-screen flex flex-col relative bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      
      {/* Top Navigation */}
      <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 shadow-sm z-30 transition-colors duration-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <AppLogo className="w-8 h-8" />
          </div>
          <span className="font-bold text-slate-800 dark:text-white text-lg hidden md:block">Utpadakata</span>
          <span className="mx-2 text-slate-300 dark:text-slate-600 hidden md:block">|</span>
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium truncate max-w-[150px]">{user.name}'s Workspace</span>
          
          {userRole === 'view' && <span className="bg-slate-200 dark:bg-slate-700 text-xs px-2 py-1 rounded-full text-slate-600 dark:text-slate-300 ml-2">Read Only</span>}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
           <Button variant="primary" onClick={() => setShareModalOpen(true)} className="hidden sm:inline-flex bg-brand-600 hover:bg-brand-700">
             <Share2 className="w-4 h-4 mr-2" />
             <span className="hidden lg:inline">Share</span>
           </Button>

           <Button variant={viewMode === ViewMode.DASHBOARD ? 'primary' : 'ghost'} onClick={() => setViewMode(ViewMode.DASHBOARD)} className={viewMode === ViewMode.BOARD ? 'text-slate-500 dark:text-slate-400' : ''}>
             <PieChart className="w-4 h-4 sm:mr-2" /> 
             <span className="hidden sm:inline">Dashboard</span>
           </Button>
           <Button variant={viewMode === ViewMode.BOARD ? 'primary' : 'ghost'} onClick={() => setViewMode(ViewMode.BOARD)} className={viewMode === ViewMode.DASHBOARD ? 'text-slate-500 dark:text-slate-400' : ''}>
             <Layout className="w-4 h-4 sm:mr-2" /> 
             <span className="hidden sm:inline">Board</span>
           </Button>
           
           <button 
             onClick={() => setSettingsModalOpen(true)}
             className="ml-2 w-9 h-9 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all hover:scale-105"
             title="Settings & Profile"
            >
             <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 relative overflow-hidden ${!canEdit && !canComment ? 'pointer-events-none' : ''}`}>
        {viewMode === ViewMode.BOARD ? (
          <>
            <Whiteboard 
              items={items} 
              setItems={canEdit ? setItems : () => {}} 
              viewState={viewState} 
              setViewState={setViewState} 
              isDarkMode={user.preferences.theme === 'dark'}
            />
            
            {/* Floating Toolbar - Only show if can edit or comment */}
            {canComment && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-700 p-2 rounded-2xl shadow-xl z-20 max-w-[95vw] overflow-x-auto no-scrollbar animate-fade-in">
                <Button variant="ghost" onClick={() => addItem(ItemType.NOTE)} title="Add Sticky Note" className="min-w-[40px]">
                  <StickyNote className="w-5 h-5 text-yellow-500" />
                </Button>
                {canEdit && (
                  <>
                    <Button variant="ghost" onClick={() => addItem(ItemType.TASK)} title="Add Task" className="min-w-[40px]">
                      <CheckSquare className="w-5 h-5 text-blue-500" />
                    </Button>
                    <Button variant="ghost" onClick={() => addItem(ItemType.GROUP)} title="Add Group" className="min-w-[40px]">
                      <Folder className="w-5 h-5 text-indigo-500" />
                    </Button>
                    <Button variant="ghost" onClick={() => addItem(ItemType.EXPENSE_WIDGET)} title="Add Expense Tracker" className="min-w-[40px]">
                      <DollarSign className="w-5 h-5 text-green-500" />
                    </Button>
                  </>
                )}
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 flex-shrink-0"></div>
                <Button variant="primary" onClick={runAiAnalysis} className="bg-gradient-to-r from-indigo-500 to-purple-600 border-none text-white whitespace-nowrap">
                  <Sparkles className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">AI Assist</span> <span className="sm:hidden">AI</span>
                </Button>
              </div>
            )}
          </>
        ) : (
          <Dashboard items={items} globalExpenses={globalExpenses} onBack={() => setViewMode(ViewMode.BOARD)} />
        )}
      </main>

      {/* Modals */}
      <Modal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} title="Workspace Insights">
         {isAiLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500 mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400">Analyzing your board...</p>
            </div>
         ) : (
            <div className="prose prose-sm text-slate-700 dark:text-slate-300 dark:prose-invert" dangerouslySetInnerHTML={{ __html: aiAnalysis }} />
         )}
         {!isAiLoading && (
           <div className="mt-6 flex justify-end">
             <Button onClick={() => setAiModalOpen(false)}>Close</Button>
           </div>
         )}
      </Modal>

      <ShareModal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} workspaceId={user.id} />

      <Modal isOpen={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} title="Profile & Settings">
          <div className="space-y-6">
             <div>
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Profile</h4>
                <div className="flex items-center gap-4 mb-4">
                   <img src={editAvatar} alt="Avatar" className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-600" />
                   <div className="flex-1">
                      <Input 
                        label="Avatar URL" 
                        value={editAvatar} 
                        onChange={e => setEditAvatar(e.target.value)} 
                        placeholder="https://..."
                      />
                   </div>
                </div>
                <Input 
                  label="Display Name" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                />
             </div>
             <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Appearance</h4>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                      {user.preferences.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                      <span>Dark Mode</span>
                   </div>
                   <button 
                     onClick={toggleTheme}
                     className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${user.preferences.theme === 'dark' ? 'bg-brand-600' : 'bg-slate-300'}`}
                   >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${user.preferences.theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                   </button>
                </div>
             </div>
             <div className="pt-6 flex justify-between items-center border-t border-slate-200 dark:border-slate-700">
                 <Button variant="danger" onClick={() => setUser(null)} icon={LogOut}>Sign Out</Button>
                 <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setSettingsModalOpen(false)}>Cancel</Button>
                    <Button onClick={saveProfile}>Save Changes</Button>
                 </div>
             </div>
          </div>
      </Modal>

    </div>
  );
};

export default App;