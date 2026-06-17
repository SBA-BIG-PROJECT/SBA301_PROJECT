import React, { useEffect, useState } from 'react';
import { userService, paymentService } from '../services';

const AdminHomePage = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Here you can use the newly created services
        // Example: const userStats = await userService.getUserStats();
        // setStats(userStats.data);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div className="admin-homepage min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Users Management</h2>
          <p className="text-gray-400">View and manage user accounts, stats, and subscriptions.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Movies & Genres</h2>
          <p className="text-gray-400">Manage movies, genres, and recommendations.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Payments & Revenue</h2>
          <p className="text-gray-400">Track premium subscriptions and payment webhooks.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminHomePage;
