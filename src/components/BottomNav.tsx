import React from 'react';
import { Home, ShoppingBag, PlusCircle, Clock, FileCheck2, HelpCircle, Settings } from 'lucide-react';

interface BottomNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export default function BottomNav({ currentRoute, onNavigate }: BottomNavProps) {
  const items = [
    { label: 'Home', route: '/', icon: Home },
    { label: 'Services', route: '/services', icon: ShoppingBag },
    { label: 'Add Funds', route: '/add-funds', icon: PlusCircle, isMain: true },
    { label: 'Deposits', route: '/deposits', icon: FileCheck2 },
    { label: 'Orders', route: '/orders', icon: Clock },
    { label: 'Support', route: '/support', icon: HelpCircle },
  ];

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-40">
      <nav className="flex items-center justify-around bg-slate-950/90 border border-purple-900/50 rounded-2xl p-2 backdrop-blur-2xl shadow-2xl shadow-purple-950/80">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.route;

          if (item.isMain) {
            return (
              <button
                key={item.route}
                onClick={() => onNavigate(item.route)}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 text-white shadow-xl shadow-purple-600/50 border-2 border-slate-950 transition-all transform active:scale-95 ${
                  isActive ? 'ring-2 ring-purple-400' : ''
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-purple-300 mt-1">Add Funds</span>
              </button>
            );
          }

          return (
            <button
              key={item.route}
              onClick={() => onNavigate(item.route)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all min-w-[48px] ${
                isActive ? 'text-purple-300 font-bold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all ${
                isActive ? 'bg-purple-900/50 shadow-sm shadow-purple-500/30' : ''
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-gray-400'}`} />
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
