import React, { useState, useEffect, useMemo } from 'react';
import universities from '../../data/universities.json';

const OwnerUpdateBoarding = ({ boarding, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    nearestUniversities: '',
    monthlyRent: '',
    boardingType: 'any',
    lifestyleTags: [],
    totalCapacity: ''
  });

  useEffect(() => {
    if (!boarding) return;
    setForm({
      title: boarding.title || '',
      description: boarding.description || '',
      address: boarding.address || '',
      city: boarding.city || '',
      nearestUniversities: (boarding.nearestUniversities || []).join(', '),
      monthlyRent: boarding.monthlyRent || '',
      boardingType: boarding.boardingType || 'any',
      lifestyleTags: boarding.lifestyleTags || [],
      totalCapacity: boarding.totalCapacity || ''
    });
  }, [boarding]);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const [showSuggestions, setShowSuggestions] = useState(false);

  const currentToken = useMemo(() => {
    const value = form.nearestUniversities || '';
    return value.split(',').pop().trim();
  }, [form.nearestUniversities]);

  const suggestions = useMemo(() => {
    if (!currentToken) return [];
    const term = currentToken.toLowerCase();
    return Object.entries(universities)
      .filter(([code, name]) => code.toLowerCase().includes(term) || name.toLowerCase().includes(term))
      .slice(0, 8)
      .map(([code, name]) => ({ code, name }));
  }, [currentToken]);

  const applyUniversity = (value) => {
    const raw = form.nearestUniversities || '';
    const lastComma = raw.lastIndexOf(',');
    const prefix = lastComma >= 0 ? raw.slice(0, lastComma).trim() : '';
    const next = prefix ? `${prefix}, ${value}, ` : `${value}, `;
    setForm((prev) => ({ ...prev, nearestUniversities: next }));
    setShowSuggestions(false);
  };

  const handleCheckboxChange = (tag) => {
    setForm(prev => {
      const isChecked = prev.lifestyleTags.includes(tag);
      return {
        ...prev,
        lifestyleTags: isChecked ? prev.lifestyleTags.filter(t => t !== tag) : [...prev.lifestyleTags, tag]
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description,
      address: form.address,
      city: form.city,
      nearestUniversities: form.nearestUniversities ? form.nearestUniversities.split(',').map(s => s.trim()) : [],
      monthlyRent: Number(form.monthlyRent) || 0,
      boardingType: form.boardingType,
      lifestyleTags: form.lifestyleTags,
      totalCapacity: Number(form.totalCapacity) || 0
    };

    onSubmit(boarding._id, payload);
  };

  if (!boarding) return null;

  const LIFESTYLE_OPTIONS = [
    'Quiet Environment',
    'Cooking Allowed',
    'AC Rooms',
    'Attached Bathroom',
    'WiFi Available',
    'Parking Space',
    'Security Cameras',
    'Walking Distance to Uni',
    'Laundry Facilities',
    'Meals Provided'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center bg-white rounded-t-xl px-6 py-4 border-b">
          <h4 className="text-lg font-semibold text-gray-900">Update Boarding</h4>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="bg-white rounded-b-xl overflow-y-auto" style={{ maxHeight: 'calc(90vh - 64px)' }}>
          <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col">
              <label htmlFor="title" className="mb-1 text-sm font-medium text-gray-700">Title</label>
              <input id="title" name="title" value={form.title} onChange={handleChange} placeholder="Boarding Title" className="w-full px-3 py-2 border rounded" required />
            </div>

            <div className="flex flex-col">
              <label htmlFor="city" className="mb-1 text-sm font-medium text-gray-700">City</label>
              <input id="city" name="city" value={form.city} onChange={handleChange} placeholder="City" className="w-full px-3 py-2 border rounded" required />
            </div>

            <div className="sm:col-span-2 flex flex-col">
              <label htmlFor="address" className="mb-1 text-sm font-medium text-gray-700">Address</label>
              <input id="address" name="address" value={form.address} onChange={handleChange} placeholder="Address" className="sm:col-span-2 w-full px-3 py-2 border rounded" required />
            </div>

            <div className="flex flex-col">
              <label htmlFor="monthlyRent" className="mb-1 text-sm font-medium text-gray-700">Monthly Rent (LKR)</label>
              <input id="monthlyRent" name="monthlyRent" value={form.monthlyRent} onChange={handleChange} type="number" placeholder="Monthly Rent" className="w-full px-3 py-2 border rounded" />
            </div>

            <div className="flex flex-col">
              <label htmlFor="totalCapacity" className="mb-1 text-sm font-medium text-gray-700">Total Capacity</label>
              <input id="totalCapacity" name="totalCapacity" value={form.totalCapacity} onChange={handleChange} type="number" placeholder="Total Capacity" className="w-full px-3 py-2 border rounded" />
            </div>

            <div className="flex flex-col">
              <label htmlFor="boardingType" className="mb-1 text-sm font-medium text-gray-700">Boarding Type</label>
              <select id="boardingType" name="boardingType" value={form.boardingType} onChange={handleChange} className="w-full px-3 py-2 border rounded">
                <option value="any">Any gender</option>
                <option value="boys">Boys only</option>
                <option value="girls">Girls only</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex flex-col">
              <label htmlFor="nearestUniversities" className="mb-1 text-sm font-medium text-gray-700">Nearest Universities</label>
              <div className="relative">
                <input
                  id="nearestUniversities"
                  name="nearestUniversities"
                  value={form.nearestUniversities}
                  onChange={(e) => { handleChange(e); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Nearest universities (comma separated)"
                  className="sm:col-span-2 w-full px-3 py-2 border rounded"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {suggestions.map((u) => (
                      <button
                        type="button"
                        key={u.code}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyUniversity(u.code)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                      >
                        {u.code} - {u.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sm:col-span-2 border rounded p-3">
              <p className="font-semibold mb-2">Lifestyle & Amenities</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LIFESTYLE_OPTIONS.map(tag => (
                  <label key={tag} className="flex items-center gap-2">
                    <input id={`lt-${tag}`} type="checkbox" checked={form.lifestyleTags.includes(tag)} onChange={() => handleCheckboxChange(tag)} />
                    <span className="text-sm">{tag}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 flex flex-col">
              <label htmlFor="description" className="mb-1 text-sm font-medium text-gray-700">Description</label>
              <textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="Description" rows={4} className="sm:col-span-2 w-full px-3 py-2 border rounded" />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Update Boarding</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OwnerUpdateBoarding;
