import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Globe, Search, Settings, ChevronDown, ChevronRight } from 'lucide-react';

interface PatternItem {
  id: string;
  pattern?: string;
  url?: string;
  name: string;
  description?: string;
  enabled: boolean;
}

interface PatternListEditorProps {
  items: PatternItem[];
  onAddItem: (item: Omit<PatternItem, 'id'>) => void;
  onUpdateItem: (id: string, updates: Partial<PatternItem>) => void;
  onRemoveItem: (id: string) => void;
  title: string;
  description?: string;
  itemTypeLabel: string;
  patternLabel?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  allowDescription?: boolean;
  maxItems?: number;
}

export function PatternListEditor({
  items,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  title,
  description,
  itemTypeLabel,
  patternLabel = "Pattern",
  placeholder = "Enter pattern...",
  icon,
  allowDescription = true,
  maxItems
}: PatternListEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    pattern: '',
    url: '',
    name: '',
    description: '',
    enabled: true,
  });

  const resetForm = () => {
    setFormData({
      pattern: '',
      url: '',
      name: '',
      description: '',
      enabled: true,
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;
    
    const itemData = {
      name: formData.name.trim(),
      description: allowDescription ? formData.description.trim() : undefined,
      enabled: formData.enabled,
      ...(patternLabel === "URL" ? { url: formData.url.trim() } : { pattern: formData.pattern.trim() })
    };

    if (editingId) {
      onUpdateItem(editingId, itemData);
    } else {
      onAddItem(itemData);
    }
    
    resetForm();
  };

  const handleEdit = (item: PatternItem) => {
    setFormData({
      pattern: item.pattern || '',
      url: item.url || '',
      name: item.name,
      description: item.description || '',
      enabled: item.enabled,
    });
    setEditingId(item.id);
    setShowAddForm(true);
  };

  const canAddMore = !maxItems || items.length < maxItems;

  return (
    <div className="border border-gray-200 rounded-lg">
      <div 
        className="p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon && <div className="text-gray-600">{icon}</div>}
            <div>
              <h4 className="font-medium text-gray-900">{title}</h4>
              {description && (
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
              {items.filter(item => item.enabled).length} active
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          {/* Items List */}
          {items.length > 0 && (
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => onUpdateItem(item.id, { enabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">{item.name}</span>
                        <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-700">
                          {item.pattern || item.url}
                        </code>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-500">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Form */}
          {showAddForm ? (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-blue-900">
                  {editingId ? `Edit ${itemTypeLabel}` : `Add ${itemTypeLabel}`}
                </h5>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {patternLabel}
                  </label>
                  <input
                    type="text"
                    value={patternLabel === "URL" ? formData.url : formData.pattern}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [patternLabel === "URL" ? 'url' : 'pattern']: e.target.value
                    }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter a descriptive name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {allowDescription && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add a description for this configuration..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                  Enable this {itemTypeLabel.toLowerCase()}
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingId ? 'Update' : 'Add'} {itemTypeLabel}
                </button>
              </div>
            </form>
          ) : (
            canAddMore && (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add {itemTypeLabel}</span>
              </button>
            )
          )}

          {!canAddMore && maxItems && (
            <div className="text-center p-3 text-sm text-gray-500 bg-gray-50 rounded-lg">
              Maximum of {maxItems} {itemTypeLabel.toLowerCase()}s allowed
            </div>
          )}

          {items.length === 0 && !showAddForm && (
            <div className="text-center p-6 text-gray-500">
              <div className="mb-2">No {itemTypeLabel.toLowerCase()}s configured</div>
              <div className="text-sm">Click "Add {itemTypeLabel}" to get started</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}