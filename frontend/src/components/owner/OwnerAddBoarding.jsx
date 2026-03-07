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

  return (
    <form
      onSubmit={handleSubmit}
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
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          required
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
      </div>

      <div className="space-y-1">
        <input
          name="city"
          value={form.city}
          onChange={handleChange}
          required
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
      </div>

      {/* Full width fields */}
      <div className="sm:col-span-2 space-y-1">
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          required
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
      </div>

      <div className="space-y-1">
        <input
          name="monthlyRent"
          value={form.monthlyRent}
          onChange={handleChange}
          required
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
        <input
          name="totalCapacity"
          value={form.totalCapacity}
          onChange={handleChange}
          required
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
      </div>

      <div className="space-y-1">
        <select
          name="boardingType"
          value={form.boardingType}
          onChange={handleChange}
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
      </div>

      <div className="sm:col-span-2 space-y-1 relative">
        <input
          name="nearestUniversities"
          value={form.nearestUniversities}
          onChange={(e) => {
            handleChange(e);
            setShowSuggestions(true);
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
                onChange={() => handleCheckboxChange(tag)}
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
      </div>

      {/* Description */}
      <div className="sm:col-span-2 space-y-1">
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
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