import React from 'react';
import { 
  Search, 
  X, 
  Sparkles, 
  Cpu, 
  Keyboard, 
  Home, 
  Headphones, 
  Watch, 
  Tv, 
  Smartphone, 
  Gamepad2, 
  Camera, 
  Coffee 
} from 'lucide-react';
import { Category } from '../types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange
}) => {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Watch': return <Watch className="w-3.5 h-3.5" />;
      case 'Tv': return <Tv className="w-3.5 h-3.5" />;
      case 'Smartphone': return <Smartphone className="w-3.5 h-3.5" />;
      case 'Gamepad2': return <Gamepad2 className="w-3.5 h-3.5" />;
      case 'Camera': return <Camera className="w-3.5 h-3.5" />;
      case 'Coffee': return <Coffee className="w-3.5 h-3.5" />;
      case 'Cpu': return <Cpu className="w-3.5 h-3.5" />;
      case 'Keyboard': return <Keyboard className="w-3.5 h-3.5" />;
      case 'Home': return <Home className="w-3.5 h-3.5" />;
      case 'Headphones': return <Headphones className="w-3.5 h-3.5" />;
      default: return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Interactive Segmented Tabs (Compliant with Filter Controls rule) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'all' || !selectedCategory
                ? 'bg-[#0B132B] text-white shadow-sm border border-slate-700'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            <span>Todas as Avaliações</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.name)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#0B132B] text-white shadow-sm border border-slate-700'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {getCategoryIcon(cat.iconName)}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Real-time instant search input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por produto, marca ou loja..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
