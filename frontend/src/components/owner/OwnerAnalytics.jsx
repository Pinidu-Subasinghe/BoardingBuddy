import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const OwnerAnalytics = () => {
  const { user } = useContext(AuthContext);
  const [analytics] = useState({
    totalBoardings: 0,
    totalVisits: 0,
    averageRating: 0,
    occupancyRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch analytics data from API
    // const fetchAnalytics = async () => {
    //   try {
    //     const response = await api.get(`/analytics?owner=${user._id}`);
    //     setAnalytics(response.data);
    //   } catch (err) {
    //     console.error('Error fetching analytics:', err);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchAnalytics();
    setLoading(false);
  }, [user]);

  if (loading) {
    return <p className="p-8 text-center">Loading...</p>;
  }

  const stats = [
    { label: 'Total Boardings', value: analytics.totalBoardings, icon: '🏠' },
    { label: 'Inspection Visits', value: analytics.totalVisits, icon: '📋' },
    { label: 'Average Rating', value: analytics.averageRating?.toFixed(1) || 'N/A', icon: '⭐' },
    { label: 'Occupancy Rate', value: `${analytics.occupancyRate}%`, icon: '📊' }
  ];

  return (
    <div className="p-8">
      <h3 className="text-2xl font-bold mb-6">Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white shadow-md rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">{stat.icon}</div>
            <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-indigo-600">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OwnerAnalytics;
