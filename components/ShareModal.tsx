import React, { useState } from 'react';
import { Modal, Button, Input } from './UIComponents';
import { Copy, Check, Globe, Shield, Edit3, Eye, MessageSquare } from 'lucide-react';
import { ShareRole } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, workspaceId }) => {
  const [role, setRole] = useState<ShareRole>('view');
  const [copied, setCopied] = useState(false);

  // Generate a mock link based on the workspace ID and selected role
  // In a real app, this would generate a specific token from the backend
  const shareLink = `${window.location.origin}/share/${workspaceId}?role=${role}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Workspace">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-4 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-100 dark:border-brand-800 text-brand-900 dark:text-brand-100">
            <Globe className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <div>
              <p className="font-semibold text-sm">Anyone with the link</p>
              <p className="text-xs opacity-80">Share this link to collaborate</p>
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            General Access
          </label>
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ShareRole)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-brand-500 outline-none text-slate-800 dark:text-slate-200"
            >
              <option value="view">Viewer (Read Only)</option>
              <option value="comment">Commenter (Add Notes Only)</option>
              <option value="edit">Editor (Full Access)</option>
            </select>
            <div className="absolute left-3 top-3.5 text-slate-500">
              {role === 'view' && <Eye className="w-5 h-5" />}
              {role === 'comment' && <MessageSquare className="w-5 h-5" />}
              {role === 'edit' && <Edit3 className="w-5 h-5" />}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Link
          </label>
          <div className="flex gap-2">
            <input 
              readOnly 
              value={shareLink} 
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-400 outline-none select-all"
            />
            <Button onClick={handleCopy} variant={copied ? "primary" : "secondary"}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
           <Shield className="w-4 h-4 mt-0.5" />
           <p>
             People with <strong>Edit</strong> access can modify, add, and delete items. 
             <strong> Viewers</strong> can only see the board updates in real-time.
           </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
};