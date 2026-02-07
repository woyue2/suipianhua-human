'use client';

import React from 'react';
import { 
  Search, Plus, Bell, FileText, 
  Clock, Users, Trash2, LayoutTemplate 
} from 'lucide-react';
import { SidebarItem } from '@/types';

interface SidebarProps {
  items: SidebarItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  return (
    <aside className="w-64 h-full bg-sidebar-light dark:bg-sidebar-dark border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-6 h-6 bg-slate-800 dark:bg-white rounded flex items-center justify-center">
            <LayoutTemplate size={14} className="text-white dark:text-slate-800" />
          </div>
          <span className="font-semibold text-sm">爱学习幕小布</span>
        </div>
        <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md">
          <Bell size={18} />
        </button>
      </div>

      <div className="px-4 mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            className="w-full bg-slate-200/50 dark:bg-slate-800 border-none rounded-md py-1.5 pl-8 text-sm focus:ring-1 focus:ring-primary outline-none" 
            placeholder="搜索文档" 
            type="text" 
          />
        </div>
        <button className="bg-slate-800 dark:bg-slate-700 text-white rounded-md p-1.5 flex items-center justify-center hover:bg-slate-900 transition-colors">
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 text-[13px]">
        <div className="px-2 py-2 mb-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          所有文档
        </div>
        
        {items.map(item => (
          <div 
            key={item.id}
            className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors
              ${item.isActive 
                ? 'bg-white dark:bg-slate-800 shadow-sm text-primary font-medium' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50'}`}
          >
            <div className="flex-shrink-0">
              {item.emoji ? (
                <span className="text-base">{item.emoji}</span>
              ) : (
                <FileText size={16} className={item.isActive ? 'text-primary' : 'text-slate-400'} />
              )}
            </div>
            <span className="truncate flex-1">{item.title}</span>
          </div>
        ))}

        <div className="pt-4 space-y-0.5 border-t border-slate-200 dark:border-slate-800 mt-4">
          <div className="flex items-center gap-2 px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md cursor-pointer text-slate-500 dark:text-slate-400">
            <Clock size={16} />
            <span>最近编辑</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md cursor-pointer text-slate-500 dark:text-slate-400">
            <Users size={16} />
            <span>与我协作</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md cursor-pointer text-slate-500 dark:text-slate-400">
            <Trash2 size={16} />
            <span>回收站</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
          <LayoutTemplate size={14} />
          <span>幕布精选</span>
        </div>
      </div>
    </aside>
  );
};

