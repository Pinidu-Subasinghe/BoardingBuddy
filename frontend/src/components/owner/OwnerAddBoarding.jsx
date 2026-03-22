import React, { useMemo, useState } from 'react';
import universities from '../../data/universities.json';

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

const OwnerAddBoarding = ({ form, setForm, handleChange, handleCheckboxChange, handleSubmit }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState({});

  const currentToken = useMemo(() => {
    const value = form.nearestUniversities || '';
    return value.split(',').pop().trim();
  }, [form.nearestUniversities]);

  const suggestions = useMemo(() => {
    if (!currentToken) return [];
    const term = currentToken.toLowerCase();
    return Object.entries(universities)
      .filter(([code, name]) =>
        code.toLowerCase().includes(term) || name.toLowerCase().includes(term)
      )
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

  const validate = (values) => {
    const e = {};
    // Title
    if (!values.title || !values.title.trim()) e.title = 'Title is required';
    else if (values.title.length > 40) e.title = 'Title must be at most 40 characters';

    // City (letters and spaces only)
    if (!values.city || !values.city.trim()) e.city = 'City is required';
    else if (!/^[A-Za-z\s]+$/.test(values.city)) e.city = 'City can contain only letters and spaces';

    // Address
    if (!values.address || !values.address.trim()) e.address = 'Address is required';
    else if (values.address.length > 100) e.address = 'Address must be at most 100 characters';

    // monthlyRent validation removed (handled via input sanitization)

    // Total capacity
    if (values.totalCapacity === '' || values.totalCapacity === null || values.totalCapacity === undefined) e.totalCapacity = 'Total capacity is required';
    else if (!/^\d+$/.test(String(values.totalCapacity))) e.totalCapacity = 'Total capacity must be a positive integer';
    else if (Number(values.totalCapacity) === 0) e.totalCapacity = 'Total capacity cannot be 0';

    // Boarding type
    if (!values.boardingType) e.boardingType = 'Boarding type is required';

    // Nearest universities (at least 1)
    const uniList = (values.nearestUniversities || '').split(',').map(s => s.trim()).filter(Boolean);
    if (uniList.length === 0) e.nearestUniversities = 'Add at least one nearest university';

    // Lifestyle tags
    if (!values.lifestyleTags || values.lifestyleTags.length === 0) e.lifestyleTags = 'Select at least one lifestyle/amenity';

    // Description (optional) - limit and no special chars
    if (values.description) {
      if (values.description.length > 150) e.description = 'Description must be at most 150 characters';
      else if (!/^[A-Za-z0-9\s.,'()-]*$/.test(values.description)) e.description = 'Description contains invalid characters';
    }

    return e;
  };

  const clearFieldError = (name, value) => {
    const nextForm = { ...form, [name]: value };
    const v = validate(nextForm);
    setErrors(prev => {
      const next = { ...prev };
      if (!v[name]) delete next[name];
      else next[name] = v[name];
      return next;
    });
  };

  const onSubmitLocal = (e) => {
    e.preventDefault();
    const validation = validate(form);
    setErrors(validation);
    if (Object.keys(validation).length === 0) {
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={onSubmitLocal}
      className="
        bg-white 
        rounded-2xl 
        shadow-xl 
        border border-gray-200/70 
        p-5 sm:p-6 md:p-8 lg:p-10 
        mx-auto 
        w-full 
        max-w-5xl
        transition-all duration-300
      "
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 lg:gap-7">
      {/* Title & City - side by side on md+ */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">Title *</label>
          <span className={`text-xs ${form.title.length >= 40 ? 'text-rose-600' : 'text-gray-500'}`}>{form.title.length}/40{form.title.length >= 40 ? ' — Title limit reached' : ''}</span>
        </div>
        <input
          name="title"
          value={form.title}
          onChange={(ev) => {
            const value = ev.target.value.length <= 40 ? ev.target.value : ev.target.value.slice(0, 40);
            handleChange({ target: { name: 'title', value } });
            clearFieldError('title', value);
          }}
          placeholder="Boarding Title *"
          className="
            w-full px-4 py-3.5 
            bg-gray-50/70 hover:bg-gray-50 
            border border-gray-300 rounded-xl 
            focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 
            placeholder-gray-400 text-gray-800 
            transition-all duration-200
          "
        />
        {errors.title && <p className="text-rose-600 text-sm mt-1">{errors.title}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">City *</label>
        <input
          name="city"
          value={form.city}
          onChange={(ev) => {
            const filtered = ev.target.value.replace(/[^A-Za-z\s]/g, '');
            handleChange({ target: { name: 'city', value: filtered } });
            clearFieldError('city', filtered);
          }}
          placeholder="City *"
          className="
            w-full px-4 py-3.5 
            bg-gray-50/70 hover:bg-gray-50 
            border border-gray-300 rounded-xl 
            focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 
            placeholder-gray-400 text-gray-800 
            transition-all duration-200
          "
        />
        {errors.city && <p className="text-rose-600 text-sm mt-1">{errors.city}</p>}
      </div>

      {/* Full width fields */}
      <div className="sm:col-span-2 space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">Address *</label>
          <span className={`text-xs ${form.address.length >= 100 ? 'text-rose-600' : 'text-gray-500'}`}>{form.address.length}/100{form.address.length >= 100 ? ' — Address limit reached' : ''}</span>
        </div>
        <input
          name="address"
          value={form.address}
          onChange={(ev) => {
            // allow letters, numbers, spaces and common punctuation (.,'()-/#)
            const filtered = ev.target.value.replace(new RegExp("[^A-Za-z0-9\\s.,'()/#-]", 'g'), '');
            const next = filtered.length <= 100 ? filtered : filtered.slice(0, 100);
            handleChange({ target: { name: 'address', value: next } });
            clearFieldError('address', next);
          }}
          placeholder="Full Address *"
          className="
            w-full px-4 py-3.5 
            bg-gray-50/70 hover:bg-gray-50 
            border border-gray-300 rounded-xl 
            focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 
            placeholder-gray-400 text-gray-800 
            transition-all duration-200
          "
        />
        {errors.address && <p className="text-rose-600 text-sm mt-1">{errors.address}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Monthly Rent (LKR) *</label>
        <input
          name="monthlyRent"
          value={form.monthlyRent}
          onChange={(ev) => {
            let v = String(ev.target.value || '');
            // keep digits only
            v = v.replace(/\D+/g, '');
            // strip leading zeros so value cannot start with 0
            v = v.replace(/^0+/, '');
            // limit to 5 digits (max 99999)
            if (v.length > 5) v = v.slice(0, 5);
            handleChange({ target: { name: 'monthlyRent', value: v } });
          }}
          type="number"
          placeholder="Monthly Rent (LKR) *"
          className="
            w-full px-4 py-3.5 
            bg-gray-50/70 hover:bg-gray-50 
            border border-gray-300 rounded-xl 
            focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 
            placeholder-gray-400 text-gray-800 
            transition-all duration-200
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
          "
        />
        
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Total Capacity *</label>
        <input
          name="totalCapacity"
          value={form.totalCapacity}
          onChange={(ev) => { handleChange(ev); clearFieldError('totalCapacity', ev.target.value); }}
          type="number"
          placeholder="Total Capacity *"
          className="
            w-full px-4 py-3.5 
            bg-gray-50/70 hover:bg-gray-50 
            border border-gray-300 rounded-xl 
            focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 
            placeholder-gray-400 text-gray-800 
            transition-all duration-200
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
          "
        />
        {errors.totalCapacity && <p className="text-rose-600 text-sm mt-1">{errors.totalCapacity}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Boarding Type *</label>
        <select
          name="boardingType"
          value={form.boardingType}
          onChange={(ev) => { handleChange(ev); clearFieldError('boardingType', ev.target.value); }}
          className="
            w-full px-4 py-3.5 
            bg-gray-50/70 hover:bg-gray-50 
            border border-gray-300 rounded-xl 
            focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 
            text-gray-700 
            transition-all duration-200
          "
        >
          <option value="any">Any gender</option>
          <option value="boys">Boys only</option>
          <option value="girls">Girls only</option>
        </select>
        {errors.boardingType && <p className="text-rose-600 text-sm mt-1">{errors.boardingType}</p>}
      </div>

      <div className="sm:col-span-2 space-y-1 relative">
        <label className="text-sm font-medium text-gray-700">Nearest Universities *</label>
        <input
          name="nearestUniversities"
          value={form.nearestUniversities}
          onChange={(e) => {
            handleChange(e);
            setShowSuggestions(true);
            clearFieldError('nearestUniversities', e.target.value);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Nearest universities (comma separated)"
          className="
            w-full px-4 py-3.5 
            bg-gray-50/70 hover:bg-gray-50 
            border border-gray-300 rounded-xl 
            focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 
            placeholder-gray-400 text-gray-800 
            transition-all duration-200
          "
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
        {errors.nearestUniversities && <p className="text-rose-600 text-sm mt-1">{errors.nearestUniversities}</p>}
      </div>

      {/* Lifestyle section */}
      <div className="sm:col-span-2 border border-gray-200/60 rounded-xl p-5 bg-gray-50/40">
        <p className="font-semibold text-gray-700 mb-4 text-lg">
          Lifestyle & Amenities
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {LIFESTYLE_OPTIONS.map(tag => (
            <label
              key={tag}
              className="
                flex items-center gap-2.5 
                cursor-pointer group
                text-sm text-gray-700
                transition-colors
                hover:text-indigo-700
              "
            >
              <input
                type="checkbox"
                checked={form.lifestyleTags.includes(tag)}
                onChange={() => {
                  // toggle via provided handler
                  handleCheckboxChange(tag);
                  const next = form.lifestyleTags.includes(tag) ? form.lifestyleTags.filter(t => t !== tag) : [...form.lifestyleTags, tag];
                  clearFieldError('lifestyleTags', next);
                }}
                className="
                  w-5 h-5 shrink-0
                  text-indigo-600 
                  border-2 border-gray-300 rounded 
                  focus:ring-indigo-500/40
                  group-hover:border-indigo-400
                  transition-colors
                "
              />
              <span>{tag}</span>
            </label>
          ))}
        </div>
        {errors.lifestyleTags && <p className="text-rose-600 text-sm mt-2">{errors.lifestyleTags}</p>}
      </div>

      {/* Description */}
      <div className="sm:col-span-2 space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">Description (optional)</label>
          <span className={`text-xs ${form.description.length >= 150 ? 'text-rose-600' : 'text-gray-500'}`}>{form.description.length}/150{form.description.length >= 150 ? ' — Description limit reached' : ''}</span>
        </div>
        <textarea
          name="description"
          value={form.description}
          onChange={(ev) => {
            const value = ev.target.value.length <= 150 ? ev.target.value : ev.target.value.slice(0, 150);
            handleChange({ target: { name: 'description', value } });
            clearFieldError('description', value);
          }}
          placeholder="Description (optional)"
          rows={5}
          className="
            w-full px-4 py-3.5 
            bg-gray-50/70 hover:bg-gray-50 
            border border-gray-300 rounded-xl 
            focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 
            placeholder-gray-400 text-gray-800 
            resize-y min-h-[110px]
            transition-all duration-200
          "
        />
        {errors.description && <p className="text-rose-600 text-sm mt-1">{errors.description}</p>}
      </div>
    </div>

    {/* Submit button */}
    <div className="mt-8 flex justify-end">
      <button
        type="submit"
        className="
          px-8 py-3.5 
          bg-gradient-to-r from-indigo-600 to-indigo-700 
          hover:from-indigo-700 hover:to-indigo-800 
          text-white font-medium 
          rounded-xl shadow-lg 
          hover:shadow-xl 
          active:scale-[0.98] 
          transition-all duration-300
        "
      >
        Create Boarding
      </button>
    </div>
    </form>
  );
};

export default OwnerAddBoarding;