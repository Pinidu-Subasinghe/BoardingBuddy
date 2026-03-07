import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { addBoarding as apiAddBoarding, getBoardings as apiGetBoardings } from '../../api/api';
import OwnerBoardingCard from './OwnerBoardingCard';
import OwnerAddBoarding from './OwnerAddBoarding';


const OwnerBoardings = () => {
  const { user } = useContext(AuthContext);
  const [boardings, setBoardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
        totalCapacity: ''
      });
    } catch (err) {
      console.error('Error creating boarding:', err);
      alert(err.response?.data?.message || 'Error creating boarding');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-lg font-medium text-indigo-600">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading your boardings...
        </div>
      </div>
    );
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
              <OwnerBoardingCard key={boarding._id} boarding={boarding} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerBoardings;