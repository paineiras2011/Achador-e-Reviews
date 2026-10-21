import React, { useState } from 'react';
import { Category, Review } from '../../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Sparkles, 
  Cpu, 
  Keyboard, 
  Home, 
  Headphones, 
  Gamepad2, 
  Smartphone, 
  Tv, 
  Camera, 
  Coffee, 
  Watch,
  FolderPlus,
  CheckCircle2
} from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  reviews: Review[];
  onSaveCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  reviews,
  onSaveCategory,
  onDeleteCategory
}) => {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [iconName, setIconName] = useState('Sparkles');
  const [description, setDescription] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const AVAILABLE_ICONS = [
    { name: 'Sparkles', label: 'Destaque', component: Sparkles },
    { name: 'Cpu', label: 'Tecnologia', component: Cpu },
    { name: 'Keyboard', label: 'Informática', component: Keyboard },
    { name: 'Home', label: 'Casa', component: Home },
    { name: 'Headphones', label: 'Áudio', component: Headphones },
    { name: 'Gamepad2', label: 'Jogos / Gamer', component: Gamepad2 },
    { name: 'Smartphone', label: 'Celulares', component: Smartphone },
    { name: 'Tv', label: 'Vídeo & TV', component: Tv },
    { name: 'Camera', label: 'Foto & Vídeo', component: Camera },
    { name: 'Watch', label: 'Relógios', component: Watch },
    { name: 'Coffee', label: 'Cozinha', component: Coffee }
  ];

  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setEditingCategory(null);
    setName('');
    setSlug('');
    setIconName('Sparkles');
    setDescription('');
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCategory(cat);
    setIsCreatingNew(false);
    setName(cat.name);
    setSlug(cat.slug);
    setIconName(cat.iconName || 'Sparkles');
    setDescription(cat.description || '');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory || !slug) {
      const generatedSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const categoryData: Category = {
      id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
      name: name.trim(),
      slug: slug.trim() || `cat-${Date.now()}`,
      iconName,
      description: description.trim()
    };

    onSaveCategory(categoryData);
    setSuccessMessage(editingCategory ? 'Categoria atualizada com sucesso!' : 'Nova categoria criada com sucesso!');
    setTimeout(() => setSuccessMessage(null), 3000);

    setIsCreatingNew(false);
    setEditingCategory(null);
  };

  const renderIcon = (iconStr: string) => {
    const iconObj = AVAILABLE_ICONS.find(i => i.name === iconStr) || AVAILABLE_ICONS[0];
    const IconComp = iconObj.component;
    return <IconComp className="w-4 h-4 text-cyan-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Gerenciador de Categorias
            </h3>
            <p className="text-xs text-slate-500">
              Crie novas categorias ou altere as existentes. Elas aparecem instantaneamente no topo, filtros e formulários.
            </p>
          </div>

          <button
            onClick={handleStartCreate}
            className="py-2 px-4 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Nova Categoria</span>
          </button>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Categories Table / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {categories.map((cat) => {
            const count = reviews.filter(r => r.category === cat.name).length;
            const isEditingThis = editingCategory?.id === cat.id;

            return (
              <div
                key={cat.id}
                className={`p-4 rounded-xl border transition-all ${
                  isEditingThis
                    ? 'border-cyan-500 bg-cyan-50/20 ring-1 ring-cyan-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                      {renderIcon(cat.iconName)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{cat.name}</h4>
                      <span className="text-3xs text-slate-400 font-mono">slug: /{cat.slug}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100 transition-colors"
                      title="Editar Categoria"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir a categoria "${cat.name}"?`)) {
                          onDeleteCategory(cat.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-2 line-clamp-1">
                  {cat.description || 'Sem descrição cadastrada'}
                </p>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-400">
                  <span>Avaliações vinculadas:</span>
                  <span className="font-mono font-bold text-slate-700">{count}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create or Edit Form */}
        {(isCreatingNew || editingCategory) && (
          <form onSubmit={handleSave} className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-cyan-600" />
                <span>{editingCategory ? `Editar: ${editingCategory.name}` : 'Criar Nova Categoria'}</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingCategory(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Jogos & Consoles"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Amigável (Slug)
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="jogos-consoles"
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição Curta
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Videogames, controles, jogos e acessórios para consoles"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ícone Representativo
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ICONS.map((item) => {
                  const IconComp = item.component;
                  const isSelected = iconName === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setIconName(item.name)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50 text-cyan-900 font-bold ring-1 ring-cyan-500'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="py-2 px-5 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Categoria</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
