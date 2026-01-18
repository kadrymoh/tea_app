// frontend/super-admin-web/src/components/EditCompanyModal.jsx
import React, { useState } from 'react';
import { X, Save, Building2, Shield, DollarSign } from 'lucide-react';

const EditCompanyModal = ({ company, onClose, onSave, theme, plans = [] }) => {
  const [formData, setFormData] = useState({
    name: company.name,
    slug: company.slug,
    domain: company.domain || '',
    plan: company.plan,
    maxRooms: company.maxRooms,
    maxUsers: company.maxUsers,
    isActive: company.isActive
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await onSave(company.id, formData);
    setSaving(false);
  };

  // Use dynamic plans from props, fallback to defaults if none provided
  const planOptions = plans.length > 0 ? plans : [
    { id: 'basic', name: 'Basic', monthlyFee: 99, maxRooms: 10, maxUsers: 5 },
    { id: 'pro', name: 'Professional', monthlyFee: 299, maxRooms: 50, maxUsers: 20 },
    { id: 'enterprise', name: 'Enterprise', monthlyFee: 999, maxRooms: 999, maxUsers: 999 }
  ];

  const handlePlanChange = (planId) => {
    const selectedPlan = planOptions.find(p => p.id === planId);
    if (selectedPlan) {
      setFormData(prev => ({
        ...prev,
        plan: planId,
        maxRooms: selectedPlan.maxRooms,
        maxUsers: selectedPlan.maxUsers
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">
      <div className={`${theme.card} rounded-2xl border ${theme.border} p-8 max-w-3xl w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-sky-500/10 rounded-xl">
              <Building2 className="w-6 h-6 text-sky-500" />
            </div>
            <h2 className={`text-2xl font-bold ${theme.text}`}>Edit Company</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 ${theme.hover} rounded-lg transition-all`}
          >
            <X className={`w-6 h-6 ${theme.text}`} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Company Name & Slug */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`${theme.text} font-medium mb-2 block text-sm`}>
                Company Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-4 py-2.5 ${theme.input} border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none`}
              />
            </div>
          </div>

          {/* Domain */}
          <div>
            <label className={`${theme.text} font-medium mb-2 block text-sm`}>
              Custom Domain (optional)
            </label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
              placeholder="company.com"
              className={`w-full px-4 py-2.5 ${theme.input} border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none`}
            />
          </div>

          {/* Plan Selection */}
          <div>
            <label className={`${theme.text} font-medium mb-2 block text-sm flex items-center`}>
              <DollarSign className="w-4 h-4 mr-2" />
              Subscription Plan *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {planOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handlePlanChange(option.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    formData.plan === option.id
                      ? 'border-sky-500 bg-sky-500/10'
                      : `border-slate-600 ${theme.hover}`
                  }`}
                >
                  <p className={`font-bold ${theme.text} mb-1`}>
                    {option.name}
                  </p>
                  <p className={`text-xs ${theme.textSecondary} mb-2`}>
                    ${option.monthlyFee}/month
                  </p>
                  <div className="space-y-1">
                    <p className={`text-xs ${theme.textSecondary}`}>
                      • {option.maxRooms} rooms
                    </p>
                    <p className={`text-xs ${theme.textSecondary}`}>
                      • {option.maxUsers} users
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`${theme.text} font-medium mb-2 block text-sm`}>
                Max Rooms
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxRooms}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  maxRooms: parseInt(e.target.value) 
                }))}
                className={`w-full px-4 py-2.5 ${theme.input} border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none`}
              />
            </div>
            <div>
              <label className={`${theme.text} font-medium mb-2 block text-sm`}>
                Max Users
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxUsers}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  maxUsers: parseInt(e.target.value) 
                }))}
                className={`w-full px-4 py-2.5 ${theme.input} border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none`}
              />
            </div>
          </div>

          {/* Status Toggle */}
          <div className={`flex items-center justify-between p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
            <div>
              <p className={`font-medium ${theme.text} mb-1 flex items-center`}>
                <Shield className="w-4 h-4 mr-2" />
                Company Status
              </p>
              <p className={`text-xs ${theme.textSecondary}`}>
                {formData.isActive ? 'Company is active and can be accessed' : 'Company is deactivated'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border after:border-slate-300 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-sky-500"></div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-slate-700">
          <button
            onClick={onClose}
            disabled={saving}
            className={`flex-1 py-3 ${theme.card} border ${theme.border} ${theme.text} rounded-lg font-medium ${theme.hover} transition-all disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !formData.name}
            className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCompanyModal;