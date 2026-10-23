import React, { useState, useRef } from 'react';
import { Category } from '../types';

interface NavbarProps {
  categories: Category[];
  activeCategory?: string;
  isGuidesActive?: boolean;
  onGoHome: () => void;
  onGoGuides?: () => void;
  onSelectCategory: (categoryName: string) => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  categories,
  activeCategory,
  isGuidesActive,
  onGoHome,
  onGoGuides,
  onSelectCategory,
  onOpenAdmin,
  isAdminLoggedIn
}) => {
  // Secret triple-click trigger on the brand for direct admin access
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleBrandClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      onOpenAdmin();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1200);
      onGoHome();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B132B]/95 backdrop-blur-md border-b border-slate-800 text-white transition-all select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Marca do Site (Triple-click secreto para acesso do gestor) */}
        <button
          onClick={handleBrandClick}
          title="Achados & Reviews"
          className="text-xl font-bold tracking-tight text-white hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 focus:outline-none cursor-pointer"
        >
          <span>Achados</span>
          <span className="text-[#FF6B00]">&amp;</span>
          <span className="text-[#00E5FF]">Reviews</span>
        </button>

        {/* Zone 2: Links de Navegação Dinâmicos das Categorias (100% funcionais) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => onSelectCategory('all')}
            className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
              (activeCategory === 'all' || !activeCategory) && !isGuidesActive
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : ''
            }`}
          >
            Início
          </button>

          {onGoGuides && (
            <button
              onClick={onGoGuides}
              className={`hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer flex items-center gap-1 ${
                isGuidesActive
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                  : ''
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Comparativos &amp; Guias</span>
            </button>
          )}

          {categories.slice(0, 4).map((cat) => {
            const isSelected = activeCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.name)}
                className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                  isSelected
                    ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                    : ''
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Vazio para visitantes comuns (Totalmente Oculto). Apenas se estiver logado mostra o status */}
        <div className="flex items-center gap-3 shrink-0">
          {isAdminLoggedIn ? (
            <button
              onClick={onOpenAdmin}
              className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-md text-xs font-semibold hover:bg-cyan-500/30 transition-colors"
            >
              Modo Gestor Ativo
            </button>
          ) : (
            <div className="w-4 h-4 opacity-0 pointer-events-none" />
          )}
        </div>

      </div>
    </header>
  );
};
