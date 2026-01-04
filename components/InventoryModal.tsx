import React, { useState, useEffect } from 'react';
import { X, Droplet } from 'lucide-react';
import { InventoryItem, ItemCategory } from '../types';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  initialData?: InventoryItem | null;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: ItemCategory.PHARMACEUTICALS,
    batchNumber: '',
    quantity: 0,
    minLevel: 10,
    unit: 'units',
    expiryDate: '',
    location: '',
    supplier: '',
    isLiquid: false,
    totalVolumeMl: 0
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        category: initialData.category,
        batchNumber: initialData.batchNumber,
        quantity: initialData.quantity,
        minLevel: initialData.minLevel,
        unit: initialData.unit,
        expiryDate: initialData.expiryDate,
        location: initialData.location,
        supplier: initialData.supplier,
        isLiquid: initialData.isLiquid || false,
        totalVolumeMl: initialData.totalVolumeMl || 0
      });
    } else {
      setFormData({
        name: '',
        category: ItemCategory.PHARMACEUTICALS,
        batchNumber: '',
        quantity: 0,
        minLevel: 10,
        unit: 'units',
        expiryDate: '',
        location: '',
        supplier: '',
        isLiquid: false,
        totalVolumeMl: 0
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      // Ensure unit reflects liquid status if not manually set to something else
      unit: formData.isLiquid && formData.unit === 'units' ? 'vials' : formData.unit
    });
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: (name === 'quantity' || name === 'minLevel' || name === 'totalVolumeMl') ? Number(value) : value
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg md:max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex-none flex justify-between items-center p-6 border-b border-gray-800 bg-gray-850 rounded-t-xl">
          <h2 className="text-lg md:text-xl font-semibold text-white">
            {initialData ? 'Edit Inventory Item' : 'Add New Item'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={24} />
          </button>
        </div>
        
        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto">
          <form id="inventory-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Liquid / Vial Toggle */}
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${formData.isLiquid ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                  <Droplet size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Liquid Medication / Vial</h4>
                  <p className="text-xs text-gray-400">Enable if this item is dispensed by volume (mL).</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="isLiquid" 
                  checked={formData.isLiquid} 
                  onChange={handleChange} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {formData.isLiquid && (
              <div className="bg-blue-900/10 border border-blue-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-200">Total Volume per Unit (mL)</label>
                    <input
                      required={formData.isLiquid}
                      type="number"
                      step="0.1"
                      name="totalVolumeMl"
                      value={formData.totalVolumeMl}
                      onChange={handleChange}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <p className="text-xs text-blue-300">
                      Defines the total mL contained in a single vial/bottle. Used for partial dispensing calculations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-400">Item Name</label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-medical-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Amoxicillin 500mg"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-medical-500 outline-none"
                >
                  {Object.values(ItemCategory).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Batch */}
               <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Batch Number</label>
                <input
                  required
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-medical-500 outline-none"
                  placeholder="e.g. BTC-2024-001"
                />
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Quantity (Units/Vials)</label>
                <input
                  required
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-medical-500 outline-none"
                />
              </div>

              {/* Min Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Min. Stock Level</label>
                <input
                  required
                  type="number"
                  name="minLevel"
                  value={formData.minLevel}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-medical-500 outline-none"
                />
              </div>

              {/* Unit Type (Visual) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Unit Type</label>
                <input
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-medical-500 outline-none"
                  placeholder="e.g. box, tablet, vial"
                />
              </div>

              {/* Expiry */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Expiry Date</label>
                <input
                  required
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-medical-500 outline-none"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Storage Location</label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-medical-500 outline-none"
                  placeholder="e.g. Shelf A-01"
                />
              </div>

               {/* Supplier */}
               <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Supplier</label>
                <input
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-medical-500 outline-none"
                  placeholder="e.g. MedSupply Co."
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-none flex justify-end gap-3 p-6 border-t border-gray-800 bg-gray-850 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="inventory-form"
            className="px-6 py-2.5 rounded-lg bg-medical-600 hover:bg-medical-500 text-white font-medium transition-colors shadow-lg shadow-medical-900/50"
          >
            {initialData ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;