import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Minus, 
  Check, 
  Layers,
  Sparkles,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { InventoryItem } from '../../types/clinic';
import { exportInventoryToExcel } from '../../utils/excelGenerator';
import { ConfirmModal } from './ConfirmModal';
import { SaveButton } from './SaveButton';

interface InventoryManagerProps {
  themeColor: 'blue' | 'purple' | 'emerald';
  allowDelete?: boolean;
}

const COMMON_CATEGORIES = [
  'Antibiotics',
  'Analgesic / Painkillers',
  'Local Anesthesia',
  'Restorative Materials',
  'Endodontics',
  'Impression Materials',
  'Sterilization',
  'Consumables',
  'Oral Care',
  'Orthodontics',
  'Surgical & Sutures',
  'Prosthodontics',
  'Dental Instruments',
  'Emergency Drugs'
];

const COMMON_UNITS = [
  'strips',
  'vials',
  'boxes',
  'bottles',
  'syringes',
  'packs',
  'pcs',
  'rolls',
  'tubes',
  'kits',
  'ampoules',
  'tablets',
  'cartridges',
  'sets'
];

export const InventoryManager: React.FC<InventoryManagerProps> = ({ 
  themeColor, 
  allowDelete = true 
}) => {
  const { 
    inventory, 
    updateInventoryQuantity, 
    updateInventoryItem, 
    addInventoryItem, 
    deleteInventoryItem 
  } = useClinic();

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'LowStock' | 'InStock'>('All');

  // Inline row quantity editing state: map of itemId -> numeric string
  const [inlineQtyValues, setInlineQtyValues] = useState<{ [id: string]: number }>({});
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  // Modal 1: Quick Quantity Editor Modal
  const [qtyModalItem, setQtyModalItem] = useState<InventoryItem | null>(null);
  const [modalQtyValue, setModalQtyValue] = useState<number>(0);

  // Modal 2: Full Edit Medicine Details Modal
  const [editModalItem, setEditModalItem] = useState<InventoryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [editQty, setEditQty] = useState(0);
  const [editUnit, setEditUnit] = useState('strips');
  const [editMinThreshold, setEditMinThreshold] = useState(10);

  // Modal 3: Add New Medicine Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Antibiotics');
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [newQty, setNewQty] = useState(20);
  const [newUnit, setNewUnit] = useState('strips');
  const [newMinThreshold, setNewMinThreshold] = useState(10);

  // Modal 4: Delete Confirmation Modal (Replaces blocked window.confirm)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Toast / notification feedback
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Filtered Items
  const filteredItems = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.unit || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const isLow = item.quantity <= (item.minThreshold || 10);
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'LowStock' && isLow) || 
                          (statusFilter === 'InStock' && !isLow);
    return matchesSearch && matchesCat && matchesStatus;
  });

  // Extract all categories in inventory
  const allCategories = Array.from(new Set(['All', ...inventory.map(i => i.category)]));

  // 1. Quick Step Quantity (+ / -)
  const handleStepQty = async (item: InventoryItem, delta: number) => {
    if (!item.id) return;
    const currentVal = inlineQtyValues[item.id] !== undefined ? inlineQtyValues[item.id] : item.quantity;
    const newCount = Math.max(0, currentVal + delta);
    setInlineQtyValues(prev => ({ ...prev, [item.id!]: newCount }));
    await updateInventoryQuantity(item.id, newCount);
    showNotice(`Updated stock for "${item.name}" to ${newCount} ${item.unit}`);
  };

  // 2. Save Inline Row Quantity
  const handleSaveInlineQty = async (item: InventoryItem) => {
    if (!item.id) return;
    const targetVal = inlineQtyValues[item.id] !== undefined ? inlineQtyValues[item.id] : item.quantity;
    setSavingRowId(item.id);
    await updateInventoryQuantity(item.id, Math.max(0, targetVal));
    setSavingRowId(null);
    showNotice(`Stock updated: ${item.name} is now ${targetVal} ${item.unit}`);
  };

  // 3. Open Quick Quantity Modal
  const openQtyModal = (item: InventoryItem) => {
    setQtyModalItem(item);
    const val = inlineQtyValues[item.id!] !== undefined ? inlineQtyValues[item.id!] : item.quantity;
    setModalQtyValue(val);
  };

  const handleSaveModalQty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qtyModalItem || !qtyModalItem.id) return;
    await updateInventoryQuantity(qtyModalItem.id, Math.max(0, modalQtyValue));
    setInlineQtyValues(prev => ({ ...prev, [qtyModalItem.id!]: modalQtyValue }));
    showNotice(`Stock for "${qtyModalItem.name}" updated to ${modalQtyValue} ${qtyModalItem.unit}`);
    setQtyModalItem(null);
  };

  // 4. Open Edit Details Modal
  const openEditDetailsModal = (item: InventoryItem) => {
    setEditModalItem(item);
    setEditName(item.name);
    setEditCategory(COMMON_CATEGORIES.includes(item.category) ? item.category : 'Other');
    setEditCustomCategory(COMMON_CATEGORIES.includes(item.category) ? '' : item.category);
    setEditQty(item.quantity);
    setEditUnit(item.unit || 'strips');
    setEditMinThreshold(item.minThreshold || 10);
  };

  const handleSaveEditDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalItem || !editModalItem.id || !editName.trim()) return;

    const finalCategory = editCategory === 'Other' && editCustomCategory.trim() 
      ? editCustomCategory.trim() 
      : editCategory;

    await updateInventoryItem(editModalItem.id, {
      name: editName.trim(),
      category: finalCategory,
      quantity: Math.max(0, Number(editQty)),
      unit: editUnit.trim() || 'strips',
      minThreshold: Math.max(1, Number(editMinThreshold))
    });
    showNotice(`Updated details for "${editName}" (${editQty} ${editUnit})`);
    setEditModalItem(null);
  };

  // 5. Save New Medicine
  const handleAddNewMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const finalCategory = newCategory === 'Other' && newCustomCategory.trim() 
      ? newCustomCategory.trim() 
      : newCategory;

    await addInventoryItem({
      name: newName.trim(),
      category: finalCategory,
      quantity: Math.max(0, Number(newQty)),
      unit: newUnit.trim() || 'strips',
      minThreshold: Math.max(1, Number(newMinThreshold))
    });
    showNotice(`Added "${newName}" with ${newQty} ${newUnit} to clinic inventory!`);
    setIsAddModalOpen(false);
    setNewName('');
    setNewCustomCategory('');
    setNewQty(20);
    setNewUnit('strips');
  };

  // 6. Delete Action (Guaranteed working via in-app ConfirmModal)
  const handleDeleteConfirm = async () => {
    if (!itemToDelete || !itemToDelete.id) return;
    const name = itemToDelete.name;
    const id = itemToDelete.id;
    setItemToDelete(null);
    await deleteInventoryItem(id);
    showNotice(`Permanently deleted "${name}" from inventory.`);
  };

  // Styling helpers
  const isPurple = themeColor === 'purple';
  const primaryBg = isPurple ? 'bg-purple-800 hover:bg-purple-900' : 'bg-blue-600 hover:bg-blue-700';
  const primaryLightBg = isPurple ? 'bg-purple-50 text-purple-900' : 'bg-blue-50 text-blue-800';
  const ringFocus = isPurple ? 'focus:ring-purple-600' : 'focus:ring-blue-500';
  const borderFocus = isPurple ? 'focus:border-purple-600' : 'focus:border-blue-500';

  return (
    <div className="space-y-6">
      
      {/* Action Toast Feedback */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-slate-900/95 text-white text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-4 border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className={`p-2.5 rounded-2xl ${primaryLightBg}`}>
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Clinic Medicine & Pharmacy Inventory
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full in-app editing of quantities, categories, units, and available stock with instant cloud sync.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className={`px-4 py-2.5 ${primaryBg} text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition hover:scale-[1.02] cursor-pointer`}
            >
              <Plus className="w-4 h-4" />
              <span>Add New Medicine</span>
            </button>

            <button
              type="button"
              onClick={() => exportInventoryToExcel(inventory)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Pill Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-slate-500 block text-[11px]">Total Items</span>
            <span className="text-lg font-black text-slate-900">{inventory.length}</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200/80">
            <span className="text-blue-700 block text-[11px]">In Healthy Stock</span>
            <span className="text-lg font-black text-blue-900">
              {inventory.filter(i => i.quantity > (i.minThreshold || 10)).length}
            </span>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80">
            <span className="text-amber-700 block text-[11px]">Low Stock Alert</span>
            <span className="text-lg font-black text-amber-900">
              {inventory.filter(i => i.quantity <= (i.minThreshold || 10)).length}
            </span>
          </div>
          <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200/80">
            <span className="text-purple-700 block text-[11px]">Categories</span>
            <span className="text-lg font-black text-purple-900">
              {allCategories.length - 1}
            </span>
          </div>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100 text-xs">
          
          {/* Search bar */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medicine name, category or unit..."
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 ${ringFocus} focus:outline-none focus:bg-white transition`}
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 ${ringFocus} focus:outline-none focus:bg-white transition`}
            >
              {allCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="sm:col-span-3 flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setStatusFilter('All')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                statusFilter === 'All' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({inventory.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('LowStock')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                statusFilter === 'LowStock' ? 'bg-amber-100 text-amber-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Low ({inventory.filter(i => i.quantity <= (i.minThreshold || 10)).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('InStock')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                statusFilter === 'InStock' ? 'bg-blue-100 text-blue-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Ok ({inventory.filter(i => i.quantity > (i.minThreshold || 10)).length})
            </button>
          </div>
        </div>

        {/* Inventory Items Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Medicine / Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Available Stock (Editable)</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Threshold</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions & Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No medicine items found.</p>
                    <p className="text-xs text-slate-400 mt-0.5">Click "Add New Medicine" button above to add to inventory.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isLow = item.quantity <= (item.minThreshold || 10);
                  const currentDisplayQty = inlineQtyValues[item.id!] !== undefined 
                    ? inlineQtyValues[item.id!] 
                    : item.quantity;
                  const hasUnsavedInlineChange = inlineQtyValues[item.id!] !== undefined && inlineQtyValues[item.id!] !== item.quantity;

                  return (
                    <tr key={item.id ? `${item.id}-${idx}` : `inv-${idx}`} className="hover:bg-slate-50/80 transition">
                      
                      {/* Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        <div className="flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {isLow && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Low stock alert" />
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px]">
                          {item.category}
                        </span>
                      </td>

                      {/* Available Stock with Direct In-Table Interactive Input & Steppers */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleStepQty(item, -1)}
                            className="w-7 h-7 bg-white hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center justify-center transition shadow-2xs cursor-pointer"
                            title="Decrease quantity by 1"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Directly editable input in row */}
                          <input
                            type="number"
                            min={0}
                            value={currentDisplayQty}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setInlineQtyValues(prev => ({ ...prev, [item.id!]: val }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveInlineQty(item);
                              }
                            }}
                            className={`w-16 text-center font-mono font-black text-sm bg-white border ${
                              hasUnsavedInlineChange ? 'border-amber-400 bg-amber-50' : 'border-slate-300'
                            } rounded-lg py-1 text-slate-900 focus:outline-none ${ringFocus}`}
                            title="Type new quantity directly and press Enter or click save"
                          />

                          <button
                            type="button"
                            onClick={() => handleStepQty(item, 1)}
                            className="w-7 h-7 bg-white hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center justify-center transition shadow-2xs cursor-pointer"
                            title="Increase quantity by 1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Save checkmark button if edited inline */}
                          {hasUnsavedInlineChange && (
                            <button
                              type="button"
                              onClick={() => handleSaveInlineQty(item)}
                              disabled={savingRowId === item.id}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-0.5 animate-pulse cursor-pointer"
                              title="Click to save new quantity"
                            >
                              <Check className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Packaging Unit */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium capitalize">
                        {item.unit}
                      </td>

                      {/* Min Threshold */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {item.minThreshold || 10}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isLow 
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Quick Edit Quantity Dialog Button */}
                        <button
                          type="button"
                          onClick={() => openQtyModal(item)}
                          className={`px-2.5 py-1.5 ${primaryLightBg} hover:opacity-85 font-bold rounded-xl text-xs transition border border-transparent shadow-2xs cursor-pointer`}
                          title="Open quantity editor dialog"
                        >
                          Edit Qty
                        </button>

                        {/* Full Edit Details Button */}
                        <button
                          type="button"
                          onClick={() => openEditDetailsModal(item)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                          title="Edit Name, Category, Unit & Threshold"
                        >
                          <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                          Details
                        </button>

                        {/* Delete Button (Working with In-App ConfirmModal) */}
                        {allowDelete && (
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                            title="Delete medicine permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL 1: QUICK IN-APP QUANTITY EDITOR ================= */}
      {qtyModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-2xl ${primaryLightBg}`}>
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Update Available Quantity</h4>
                  <p className="text-xs text-slate-500">{qtyModalItem.name} ({qtyModalItem.category})</p>
                </div>
              </div>
              <button 
                onClick={() => setQtyModalItem(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalQty} className="space-y-5">
              
              {/* Stepper Display */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 text-center">
                  Available Stock ({qtyModalItem.unit})
                </label>
                
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setModalQtyValue(prev => Math.max(0, prev - 10))}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalQtyValue(prev => Math.max(0, prev - 1))}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    -1
                  </button>

                  <input
                    type="number"
                    min={0}
                    required
                    value={modalQtyValue}
                    onChange={(e) => setModalQtyValue(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`w-28 text-center text-2xl font-black font-mono py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none ${borderFocus}`}
                  />

                  <button
                    type="button"
                    onClick={() => setModalQtyValue(prev => prev + 1)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalQtyValue(prev => prev + 10)}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    +10
                  </button>
                </div>

                <div className="flex justify-center gap-2 pt-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setModalQtyValue(prev => prev + 50)}
                    className="px-3 py-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    +50 Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalQtyValue(prev => prev + 100)}
                    className="px-3 py-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    +100 Restock
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalQtyValue(0)}
                    className="px-3 py-1 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Set to 0 (Depleted)
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQtyModalItem(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <SaveButton
                  type="button"
                  defaultText="Save Quantity"
                  savingText="Saving..."
                  successText="Saved Successfully"
                  errorText="Save Failed. Please Try Again"
                  className="px-6 py-2.5 text-xs font-bold"
                  onSave={async () => {
                    if (!qtyModalItem || !qtyModalItem.id) return false;
                    const ok = await updateInventoryQuantity(qtyModalItem.id, Math.max(0, modalQtyValue));
                    if (ok) {
                      setInlineQtyValues(prev => ({ ...prev, [qtyModalItem.id!]: modalQtyValue }));
                      showNotice(`Stock for "${qtyModalItem.name}" updated to ${modalQtyValue} ${qtyModalItem.unit}`);
                      setTimeout(() => setQtyModalItem(null), 1200);
                      return true;
                    }
                    return false;
                  }}
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: FULL EDIT MEDICINE DETAILS ================= */}
      {editModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-2xl ${primaryLightBg}`}>
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Edit Medicine Information</h4>
                  <p className="text-xs text-slate-500">Update name, category, stock, unit, and threshold.</p>
                </div>
              </div>
              <button 
                onClick={() => setEditModalItem(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDetails} className="space-y-4 text-xs">
              
              {/* Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Medicine / Item Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold ${ringFocus} focus:outline-none`}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Category *</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 ${ringFocus} focus:outline-none`}
                >
                  {COMMON_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Other">+ Custom Category...</option>
                </select>
              </div>

              {editCategory === 'Other' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Custom Category Name *</label>
                  <input
                    type="text"
                    required
                    value={editCustomCategory}
                    onChange={(e) => setEditCustomCategory(e.target.value)}
                    placeholder="Type custom category name..."
                    className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 ${ringFocus} focus:outline-none`}
                  />
                </div>
              )}

              {/* Stock and Packaging Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Available Stock (Quantity) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value))}
                    className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold ${ringFocus} focus:outline-none`}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Packaging Unit *</label>
                  <input
                    type="text"
                    required
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    placeholder="e.g. strips, vials, boxes, pcs"
                    className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 ${ringFocus} focus:outline-none`}
                  />
                </div>
              </div>

              {/* Quick Unit Presets */}
              <div>
                <span className="block text-[11px] text-slate-500 mb-1.5">Quick Unit Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_UNITS.slice(0, 8).map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setEditUnit(u)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                        editUnit === u ? 'bg-purple-100 text-purple-900 border-purple-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Threshold */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Min Stock Alert Level</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={editMinThreshold}
                  onChange={(e) => setEditMinThreshold(Number(e.target.value))}
                  className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 ${ringFocus} focus:outline-none`}
                />
                <p className="text-[10px] text-slate-400 mt-1">Triggers 'Low Stock' alert when inventory drops below this number.</p>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalItem(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <SaveButton
                  type="button"
                  defaultText="Save Medicine Details"
                  savingText="Saving..."
                  successText="Saved Successfully"
                  errorText="Save Failed. Please Try Again"
                  className="px-6 py-2.5 font-bold"
                  onSave={async () => {
                    if (!editModalItem || !editModalItem.id || !editName.trim()) return false;
                    const finalCategory = editCategory === 'Other' && editCustomCategory.trim() 
                      ? editCustomCategory.trim() 
                      : editCategory;
                    const ok = await updateInventoryItem(editModalItem.id, {
                      name: editName.trim(),
                      category: finalCategory,
                      quantity: Math.max(0, Number(editQty)),
                      unit: editUnit.trim() || 'strips',
                      minThreshold: Math.max(1, Number(editMinThreshold))
                    });
                    if (ok) {
                      showNotice(`Updated details for "${editName}" (${editQty} ${editUnit})`);
                      setTimeout(() => setEditModalItem(null), 1200);
                      return true;
                    }
                    return false;
                  }}
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ADD NEW MEDICINE MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-2xl ${primaryLightBg}`}>
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Add New Medicine to Stock</h4>
                  <p className="text-xs text-slate-500">Add newly arrived drugs, dental supplies or consumables.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewMedicine} className="space-y-4 text-xs">
              
              {/* Medicine Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Medicine / Item Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ketorol-DT 10mg / Amox-Clav 625 / 3M Resin Composite"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold ${ringFocus} focus:outline-none`}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Category *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 ${ringFocus} focus:outline-none`}
                >
                  {COMMON_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Other">+ Custom Category...</option>
                </select>
              </div>

              {newCategory === 'Other' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Custom Category Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustomCategory}
                    onChange={(e) => setNewCustomCategory(e.target.value)}
                    placeholder="e.g. Periodontics, Bleaching Materials, Maxillofacial"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 ${ringFocus} focus:outline-none`}
                  />
                </div>
              )}

              {/* Stock and Packaging Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Available Stock (Quantity) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold ${ringFocus} focus:outline-none`}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Packaging Unit *</label>
                  <input
                    type="text"
                    required
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="e.g. strips, vials, boxes, pcs"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 ${ringFocus} focus:outline-none`}
                  />
                </div>
              </div>

              {/* Quick Unit Presets */}
              <div>
                <span className="block text-[11px] text-slate-500 mb-1.5">Select Common Unit:</span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_UNITS.slice(0, 10).map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setNewUnit(u)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                        newUnit === u ? 'bg-purple-100 text-purple-900 border-purple-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Threshold */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Min Stock Alert Level</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newMinThreshold}
                  onChange={(e) => setNewMinThreshold(Number(e.target.value))}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 ${ringFocus} focus:outline-none`}
                />
                <p className="text-[10px] text-slate-400 mt-1">Alerts staff when available quantity reaches or falls below this number.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <SaveButton
                  type="button"
                  defaultText="Save New Medicine"
                  savingText="Saving..."
                  successText="Saved Successfully"
                  errorText="Save Failed. Please Try Again"
                  className="px-6 py-2.5 font-bold"
                  onSave={async () => {
                    if (!newName.trim()) return false;
                    const finalCategory = newCategory === 'Other' && newCustomCategory.trim() 
                      ? newCustomCategory.trim() 
                      : newCategory;
                    const ok = await addInventoryItem({
                      name: newName.trim(),
                      category: finalCategory,
                      quantity: Math.max(0, Number(newQty)),
                      unit: newUnit.trim() || 'strips',
                      minThreshold: Math.max(1, Number(newMinThreshold))
                    });
                    if (ok) {
                      showNotice(`Added "${newName}" with ${newQty} ${newUnit} to clinic inventory!`);
                      setTimeout(() => {
                        setIsAddModalOpen(false);
                        setNewName('');
                        setNewCustomCategory('');
                        setNewQty(20);
                        setNewUnit('strips');
                      }, 1200);
                      return true;
                    }
                    return false;
                  }}
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: IN-APP CONFIRM DELETE MODAL ================= */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Delete Medicine from Inventory?"
        message={itemToDelete ? `Are you sure you want to permanently delete "${itemToDelete.name}" (${itemToDelete.quantity} ${itemToDelete.unit}) from clinic stock? This action cannot be undone.` : ''}
        confirmText="Confirm Delete"
        onConfirm={handleDeleteConfirm}
        onClose={() => setItemToDelete(null)}
      />
    </div>
  );
};
