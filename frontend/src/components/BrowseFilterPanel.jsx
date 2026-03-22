import React from "react";

const BrowseFilterPanel = ({
  universities = [],
  amenities = [],
  filters,
  onChange,
  onToggleAmenity,
  onApply,
  onReset,
  canUseMyUniversity,
  userUniversity,
}) => {
  return (
    <aside className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      </div>

      <div className="space-y-5">
        <section className="border border-gray-100 rounded-lg p-3 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">University</h4>
          <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
            <input
              type="checkbox"
              checked={filters.nearMyUniversity}
              onChange={(e) => onChange("nearMyUniversity", e.target.checked)}
              disabled={!canUseMyUniversity}
            />
            Near my campus{userUniversity ? ` (${userUniversity})` : ''}
          </label>
          <select
            value={filters.university}
            onChange={(e) => onChange("university", e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700"
          >
            <option value="">All universities</option>
            {universities.map((u) => (
              <option key={u.code} value={u.code}>
                {u.code}
              </option>
            ))}
          </select>
        </section>

        <section className="border border-gray-100 rounded-lg p-3 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Price (LKR)</h4>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={filters.priceMin}
              onChange={(e) => onChange("priceMin", e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
            />
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={filters.priceMax}
              onChange={(e) => onChange("priceMax", e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
            />
          </div>
        </section>

        <section className="border border-gray-100 rounded-lg p-3 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Inspector Rating</h4>
          <select
            value={filters.ratingMin}
            onChange={(e) => onChange("ratingMin", e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">Any rating</option>
            <option value="40">40%+</option>
            <option value="50">50%+</option>
            <option value="60">60%+</option>
            <option value="70">70%+</option>
            <option value="80">80%+</option>
          </select>
        </section>

        <section className="border border-gray-100 rounded-lg p-3 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Safety Level</h4>
          <select
            value={filters.safetyLevel}
            onChange={(e) => onChange("safetyLevel", e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700"
          >
            <option value="">Any level</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </section>

        <section className="border border-gray-100 rounded-lg p-3 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Amenities</h4>
          {amenities.length === 0 ? (
            <div className="text-sm text-gray-500">No amenities listed</div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {amenities.map((tag) => (
                <label key={tag} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(tag)}
                    onChange={() => onToggleAmenity(tag)}
                  />
                  {tag}
                </label>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={onApply}
          className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
        >
          Apply
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Reset
        </button>
      </div>
    </aside>
  );
};

export default BrowseFilterPanel;
