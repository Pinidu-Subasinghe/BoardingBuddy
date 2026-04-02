import React, { useState, useEffect, useContext } from 'react';
import Swal from 'sweetalert2';
import { AuthContext } from '../../context/AuthContext';
import { addBoarding as apiAddBoarding, getBoardings as apiGetBoardings, updateBoarding as apiUpdateBoarding, deleteBoarding as apiDeleteBoarding } from '../../api/api';
import OwnerBoardingCard from './OwnerBoardingCard';
import OwnerAddBoarding from './OwnerAddBoarding';
import OwnerUpdateBoarding from './OwnerUpdateBoarding';
import LoadingAnimation from '../LoadingAnimation';


const OwnerBoardings = () => {
  const { user } = useContext(AuthContext);
  const [boardings, setBoardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBoarding, setEditingBoarding] = useState(null);
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
    coverImageFile: null,
    imageFiles: []
  });

  useEffect(() => {
    const fetchBoardings = async () => {
      try {
        const res = await apiGetBoardings();
        setBoardings(res.data || []);
      } catch (err) {
        console.error('Error fetching boardings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoardings();
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (tag) => {
    setForm(prev => {
      const isChecked = prev.lifestyleTags.includes(tag);
      return {
        ...prev,
        lifestyleTags: isChecked
          ? prev.lifestyleTags.filter(t => t !== tag)
          : [...prev.lifestyleTags, tag]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    (form.imageFiles || []).forEach((file) => {
      payload.append('images', file);
    });

    try {
      const res = await apiAddBoarding(payload);
      setBoardings(prev => [res.data, ...prev]);
      setShowForm(false);
      setForm({
        title: '',
        description: '',
        address: '',
        city: '',
        nearestUniversities: '',
        monthlyRent: '',
        boardingType: 'any',
        lifestyleTags: [],
        totalCapacity: '',
        coverImageFile: null,
        imageFiles: []
      });
    } catch (err) {
      console.error('Error creating boarding:', err);
      alert(err.response?.data?.message || 'Error creating boarding');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete this boarding?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await apiDeleteBoarding(id);
      setBoardings(prev => prev.filter(b => b._id !== id));
      await Swal.fire({
        title: 'Deleted',
        text: 'Boarding deleted successfully.',
        icon: 'success',
        draggable: true,
      });
    } catch (err) {
      console.error('Error deleting boarding:', err);
      alert(err.response?.data?.message || 'Error deleting boarding');
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      const res = await apiUpdateBoarding(id, payload);
      setBoardings(prev => prev.map(b => (b._id === id ? res.data : b)));
      setEditingBoarding(null);
      await Swal.fire({
        title: 'Boarding updated successfully',
        icon: 'success',
        draggable: true,
      });
    } catch (err) {
      console.error('Error updating boarding:', err);
      alert(err.response?.data?.message || 'Error updating boarding');
    }
  };

  if (loading) {
    return <LoadingAnimation text="Loading my boardings..." containerClassName="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50/70 py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            My Boardings
          </h3>

          <button
            className="
              px-5 py-2.5 rounded-lg font-medium text-white 
              bg-gradient-to-r from-indigo-600 to-indigo-700
              hover:from-indigo-700 hover:to-indigo-800
              shadow-md hover:shadow-lg transition-all duration-300
              active:scale-95
            "
            onClick={() => setShowForm(s => !s)}
          >
            {showForm ? 'Cancel' : 'Add New Boarding'}
          </button>
        </div>

        {/* Add Boarding Form as Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4">
            {/* Overlay */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setShowForm(false)} 
            />
            {/* Modal */}
            <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center bg-white rounded-t-xl px-6 py-4 border-b">
                <h4 className="text-lg font-semibold text-gray-900">Add New Boarding</h4>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="bg-white rounded-b-xl overflow-y-auto" style={{ maxHeight: 'calc(90vh - 64px)' }}>
                <OwnerAddBoarding
                  form={form}
                  setForm={setForm}
                  handleChange={handleChange}
                  handleCheckboxChange={handleCheckboxChange}
                  handleSubmit={handleSubmit}
                />
              </div>
            </div>
          </div>
        )}

        {/* Update Boarding Modal */}
        {editingBoarding && (
          <OwnerUpdateBoarding
            boarding={editingBoarding}
            onClose={() => setEditingBoarding(null)}
            onSubmit={handleUpdate}
          />
        )}

        {/* Boardings List */}
        {boardings.length === 0 ? (
          <div className="
            bg-white rounded-xl shadow-sm border border-gray-200 
            p-8 sm:p-10 text-center
          ">
            <p className="text-lg text-gray-600 font-medium">
              No boardings found
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Start by adding your first boarding above.
            </p>
          </div>
        ) : (
          <div className="
            grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 
            gap-5 sm:gap-6 lg:gap-8
          ">
            {boardings.map((boarding) => (
              <OwnerBoardingCard
                key={boarding._id}
                boarding={boarding}
                onEdit={() => setEditingBoarding(boarding)}
                onDelete={() => handleDelete(boarding._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerBoardings;