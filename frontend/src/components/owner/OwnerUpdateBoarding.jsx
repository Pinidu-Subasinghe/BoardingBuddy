import React, { useState, useEffect, useMemo } from 'react';
import universities from '../../data/universities.json';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const isAllowedImageType = (file) => {
  const type = String(file?.type || '').toLowerCase();
  return ALLOWED_IMAGE_TYPES.includes(type);
};

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
    totalCapacity: '',
    existingCoverImage: '',
    existingImages: [],
    coverImageFile: null,
    imageFiles: []
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
      totalCapacity: boarding.totalCapacity || '',
      existingCoverImage: boarding.coverImage || '',
      existingImages: boarding.images || [],
      coverImageFile: null,
      imageFiles: []
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

  const [errors, setErrors] = useState({});

  const validate = (values) => {
    const e = {};
    if (!values.title || !values.title.trim()) e.title = 'Title is required';
    else if (values.title.length > 40) e.title = 'Title must be at most 40 characters';

    if (!values.city || !values.city.trim()) e.city = 'City is required';
    else if (!/^[A-Za-z\s]+$/.test(values.city)) e.city = 'City can contain only letters and spaces';

    if (!values.address || !values.address.trim()) e.address = 'Address is required';
    else if (values.address.length > 100) e.address = 'Address must be at most 100 characters';

    // monthlyRent validation removed (handled via input sanitization)

    if (values.totalCapacity === '' || values.totalCapacity === null || values.totalCapacity === undefined) e.totalCapacity = 'Total capacity is required';
    else if (!/^\d+$/.test(String(values.totalCapacity))) e.totalCapacity = 'Total capacity must be a positive integer';
    else if (Number(values.totalCapacity) === 0) e.totalCapacity = 'Total capacity cannot be 0';

    if (!values.boardingType) e.boardingType = 'Boarding type is required';

    const uniList = (values.nearestUniversities || '').split(',').map(s => s.trim()).filter(Boolean);
    if (uniList.length === 0) e.nearestUniversities = 'Add at least one nearest university';

    if (!values.lifestyleTags || values.lifestyleTags.length === 0) e.lifestyleTags = 'Select at least one lifestyle/amenity';

    if (values.description) {
      if (values.description.length > 150) e.description = 'Description must be at most 150 characters';
      else if (!/^[A-Za-z0-9\s.,'()-]*$/.test(values.description)) e.description = 'Description contains invalid characters';
    }

    const hasCoverImage = Boolean(values.coverImageFile || values.existingCoverImage);
    if (!hasCoverImage) {
      e.coverImageFile = 'Cover image is required';
    } else if (values.coverImageFile && !isAllowedImageType(values.coverImageFile)) {
      e.coverImageFile = 'Cover image must be JPG, JPEG, or PNG';
    }

    const nextAdditionalImages = (values.imageFiles && values.imageFiles.length > 0)
      ? values.imageFiles
      : (values.existingImages || []);
    if (nextAdditionalImages.length > 5) {
      e.imageFiles = 'You can upload at most 5 additional images';
    } else if ((values.imageFiles || []).some((file) => !isAllowedImageType(file))) {
      e.imageFiles = 'Additional images must be JPG, JPEG, or PNG';
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

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length === 0) {
      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('description', form.description || '');
      payload.append('address', form.address);
      payload.append('city', form.city);
      payload.append('nearestUniversities', form.nearestUniversities || '');
      payload.append('monthlyRent', String(Number(form.monthlyRent) || 0));
      payload.append('boardingType', form.boardingType);
      payload.append('lifestyleTags', JSON.stringify(form.lifestyleTags || []));
      payload.append('totalCapacity', String(Number(form.totalCapacity) || 0));

      if (form.coverImageFile) {
        payload.append('coverImage', form.coverImageFile);
      }
      if (form.imageFiles && form.imageFiles.length > 0) {
        form.imageFiles.forEach((file) => payload.append('images', file));
      }

      onSubmit(boarding._id, payload);
    }
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
              <div className="flex justify-between items-center">
                <label htmlFor="title" className="mb-1 text-sm font-medium text-gray-700">Title</label>
                <span className={`text-xs ${form.title.length >= 40 ? 'text-rose-600' : 'text-gray-500'}`}>{form.title.length}/40{form.title.length >= 40 ? ' — Limit reached' : ''}</span>
              </div>
              <input id="title" name="title" value={form.title} onChange={(e) => { const value = e.target.value.length <= 40 ? e.target.value : e.target.value.slice(0,40); handleChange({ target: { name: 'title', value } }); clearFieldError('title', value); }} placeholder="Boarding Title" className="w-full px-3 py-2 border rounded" required />
              {errors.title && <p className="text-rose-600 text-sm mt-1">{errors.title}</p>}
            </div>

            <div className="flex flex-col">
              <label htmlFor="city" className="mb-1 text-sm font-medium text-gray-700">City</label>
              <input id="city" name="city" value={form.city} onChange={(e) => { const filtered = e.target.value.replace(/[^A-Za-z\s]/g, ''); handleChange({ target: { name: 'city', value: filtered } }); clearFieldError('city', filtered); }} placeholder="City" className="w-full px-3 py-2 border rounded" required />
              {errors.city && <p className="text-rose-600 text-sm mt-1">{errors.city}</p>}
            </div>

            <div className="sm:col-span-2 flex flex-col">
              <div className="flex justify-between items-center">
                <label htmlFor="address" className="mb-1 text-sm font-medium text-gray-700">Address</label>
                <span className={`text-xs ${form.address.length >= 100 ? 'text-rose-600' : 'text-gray-500'}`}>{form.address.length}/100{form.address.length >= 100 ? ' — Limit reached' : ''}</span>
              </div>
              <input id="address" name="address" value={form.address} onChange={(e) => {
                 const filtered = e.target.value.replace(new RegExp("[^A-Za-z0-9\\s.,'()/#-]", 'g'), '');
                 const next = filtered.length <= 100 ? filtered : filtered.slice(0, 100);
                handleChange({ target: { name: 'address', value: next } });
                clearFieldError('address', next);
              }} placeholder="Address" className="sm:col-span-2 w-full px-3 py-2 border rounded" required />
              {errors.address && <p className="text-rose-600 text-sm mt-1">{errors.address}</p>}
            </div>

            <div className="flex flex-col">
              <label htmlFor="monthlyRent" className="mb-1 text-sm font-medium text-gray-700">Monthly Rent (LKR)</label>
              <input id="monthlyRent" name="monthlyRent" value={form.monthlyRent} onChange={(e) => {
                let v = String(e.target.value || '');
                v = v.replace(/\D+/g, '');
                v = v.replace(/^0+/, '');
                if (v.length > 5) v = v.slice(0, 5);
                handleChange({ target: { name: 'monthlyRent', value: v } });
                clearFieldError('monthlyRent', v);
              }} type="number" placeholder="Monthly Rent" className="w-full px-3 py-2 border rounded" />
            </div>

            <div className="flex flex-col">
              <label htmlFor="totalCapacity" className="mb-1 text-sm font-medium text-gray-700">Total Capacity</label>
              <input id="totalCapacity" name="totalCapacity" value={form.totalCapacity} onChange={(e) => { handleChange(e); clearFieldError('totalCapacity', e.target.value); }} type="number" placeholder="Total Capacity" className="w-full px-3 py-2 border rounded" />
              {errors.totalCapacity && <p className="text-rose-600 text-sm mt-1">{errors.totalCapacity}</p>}
            </div>

            <div className="flex flex-col">
              <label htmlFor="boardingType" className="mb-1 text-sm font-medium text-gray-700">Boarding Type</label>
              <select id="boardingType" name="boardingType" value={form.boardingType} onChange={(e) => { handleChange(e); clearFieldError('boardingType', e.target.value); }} className="w-full px-3 py-2 border rounded">
                <option value="any">Any gender</option>
                <option value="boys">Boys only</option>
                <option value="girls">Girls only</option>
              </select>
              {errors.boardingType && <p className="text-rose-600 text-sm mt-1">{errors.boardingType}</p>}
            </div>

            <div className="sm:col-span-2 flex flex-col">
              <label htmlFor="nearestUniversities" className="mb-1 text-sm font-medium text-gray-700">Nearest Universities</label>
              <div className="relative">
                <input
                  id="nearestUniversities"
                  name="nearestUniversities"
                  value={form.nearestUniversities}
                  onChange={(e) => { handleChange(e); setShowSuggestions(true); clearFieldError('nearestUniversities', e.target.value); }}
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
              {errors.nearestUniversities && <p className="text-rose-600 text-sm mt-1">{errors.nearestUniversities}</p>}
            </div>

            <div className="sm:col-span-2 border rounded p-3">
              <p className="font-semibold mb-2">Lifestyle & Amenities</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LIFESTYLE_OPTIONS.map(tag => (
                  <label key={tag} className="flex items-center gap-2">
                    <input id={`lt-${tag}`} type="checkbox" checked={form.lifestyleTags.includes(tag)} onChange={() => { handleCheckboxChange(tag); const next = form.lifestyleTags.includes(tag) ? form.lifestyleTags.filter(t => t !== tag) : [...form.lifestyleTags, tag]; clearFieldError('lifestyleTags', next); }} />
                    <span className="text-sm">{tag}</span>
                  </label>
                ))}
              </div>
            </div>
            {errors.lifestyleTags && <p className="text-rose-600 text-sm mt-2">{errors.lifestyleTags}</p>}

            <div className="sm:col-span-2 flex flex-col">
                <div className="flex justify-between items-center">
                  <label htmlFor="description" className="mb-1 text-sm font-medium text-gray-700">Description</label>
                  <span className={`text-xs ${form.description.length >= 150 ? 'text-rose-600' : 'text-gray-500'}`}>{form.description.length}/150{form.description.length >= 150 ? ' — Limit reached' : ''}</span>
                </div>
                <textarea id="description" name="description" value={form.description} onChange={(e) => { const value = e.target.value.length <= 150 ? e.target.value : e.target.value.slice(0,150); handleChange({ target: { name: 'description', value } }); clearFieldError('description', value); }} placeholder="Description" rows={4} className="sm:col-span-2 w-full px-3 py-2 border rounded" />
                {errors.description && <p className="text-rose-600 text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="sm:col-span-2 border rounded p-3 space-y-4">
              <p className="font-semibold">Boarding Images</p>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Cover Image * (JPG, JPEG, PNG)</label>
                {form.existingCoverImage && !form.coverImageFile && (
                  <img
                    src={form.existingCoverImage}
                    alt="Current cover"
                    className="w-full sm:w-56 h-32 object-cover rounded border"
                  />
                )}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                    setForm((prev) => ({ ...prev, coverImageFile: file }));
                    clearFieldError('coverImageFile', file);
                  }}
                  className="w-full px-3 py-2 border rounded"
                />
                {form.coverImageFile && (
                  <p className="text-xs text-gray-600 truncate">New cover: {form.coverImageFile.name}</p>
                )}
                {errors.coverImageFile && <p className="text-rose-600 text-sm mt-1">{errors.coverImageFile}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Additional Images (up to 5)</label>
                {(!form.imageFiles || form.imageFiles.length === 0) && (form.existingImages || []).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {form.existingImages.slice(0, 5).map((img, idx) => (
                      <img
                        key={`${img}-${idx}`}
                        src={img}
                        alt={`Current boarding ${idx + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                    ))}
                  </div>
                )}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setForm((prev) => ({ ...prev, imageFiles: files }));
                    clearFieldError('imageFiles', files);
                  }}
                  className="w-full px-3 py-2 border rounded"
                />
                <p className="text-xs text-gray-500">Selecting files here replaces existing additional images.</p>
                {form.imageFiles && form.imageFiles.length > 0 && (
                  <p className="text-xs text-gray-600">{form.imageFiles.length} new additional image{form.imageFiles.length > 1 ? 's' : ''} selected</p>
                )}
                {errors.imageFiles && <p className="text-rose-600 text-sm mt-1">{errors.imageFiles}</p>}
              </div>
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
