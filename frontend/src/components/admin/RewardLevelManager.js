import React, { useState, useEffect } from 'react';
import axios from '../../services/axios';
import { toast } from 'react-toastify';

const RewardLevelManager = () => {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingLevel, setEditingLevel] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const [formData, setFormData] = useState({
    level: '',
    min_points: 0,
    max_points: 100,
    benefits: [''],
    requirements: [''],
    badge_color: '#95a5a6',
    description: ''
  });
  const [sortBy, setSortBy] = useState('min_points');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLevels();
    fetchStats();
  }, []);

  const fetchLevels = async () => {
    try {
      setError(null);
      const response = await axios.get('/api/reward-levels/levels');

      // Process the levels data and handle null max_points (which represents infinity)
      let levelsData = response.data;

      // If response is a string, parse it
      if (typeof levelsData === 'string') {
        try {
          levelsData = JSON.parse(levelsData);
        } catch (parseError) {
          setLevels([]);
          setError('Failed to parse server response');
          return;
        }
      }

      // Ensure we have an array
      if (Array.isArray(levelsData)) {
        // Process levels to handle null max_points (convert back to Infinity for display)
        const processedLevels = levelsData.map(level => ({
          ...level,
          max_points: level.max_points === null ? Infinity : level.max_points
        }));

        setLevels(processedLevels);
        setInitialized(true);
      } else {
        setLevels([]);
        setError('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]); // Ensure levels is always an array
      setError(error.response?.data?.error || 'Failed to load reward levels');
      toast.error('Failed to load reward levels');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/reward-levels/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Don't show error toast for stats as it's not critical
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        benefits: formData.benefits.filter(b => b.trim()),
        requirements: formData.requirements.filter(r => r.trim()),
        max_points: formData.max_points === 'inf' ? null : parseInt(formData.max_points)
      };

      if (editingLevel) {
        await axios.put(`/api/reward-levels/levels/${editingLevel.id}`, submitData);
        toast.success('Reward level updated successfully');
      } else {
        await axios.post('/api/reward-levels/levels', submitData);
        toast.success('Reward level created successfully');
      }

      resetForm();
      fetchLevels();
      fetchStats();
    } catch (error) {
      console.error('Error saving level:', error);
      toast.error(error.response?.data?.error || 'Failed to save reward level');
    }
  };

  const handleEdit = (level) => {
    setEditingLevel(level);
    setFormData({
      level: level.level,
      min_points: level.min_points,
      max_points: level.max_points === Infinity || level.max_points === null ? 'inf' : level.max_points,
      benefits: level.benefits.length ? level.benefits : [''],
      requirements: level.requirements?.length ? level.requirements : [''],
      badge_color: level.badge_color || '#95a5a6',
      description: level.description || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (levelId) => {
    if (window.confirm('Are you sure you want to delete this reward level?')) {
      try {
        await axios.delete(`/api/reward-levels/levels/${levelId}`);
        toast.success('Reward level deleted successfully');
        fetchLevels();
        fetchStats();
      } catch (error) {
        console.error('Error deleting level:', error);
        toast.error('Failed to delete reward level');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      level: '',
      min_points: 0,
      max_points: 100,
      benefits: [''],
      requirements: [''],
      badge_color: '#95a5a6',
      description: ''
    });
    setEditingLevel(null);
    setShowCreateForm(false);
  };

  const handleDuplicate = (level) => {
    setFormData({
      level: `${level.level} (Copy)`,
      min_points: level.min_points,
      max_points: level.max_points === Infinity || level.max_points === null ? 'inf' : level.max_points,
      benefits: [...level.benefits],
      requirements: level.requirements ? [...level.requirements] : [''],
      badge_color: level.badge_color || '#95a5a6',
      description: level.description || ''
    });
    setEditingLevel(null);
    setShowCreateForm(true);
  };

  const handleBulkDelete = async () => {
    if (window.confirm('Are you sure you want to delete all reward levels? This action cannot be undone.')) {
      try {
        for (const level of levels) {
          await axios.delete(`/api/reward-levels/levels/${level.id}`);
        }
        toast.success('All reward levels deleted successfully');
        fetchLevels();
        fetchStats();
      } catch (error) {
        console.error('Error deleting levels:', error);
        toast.error('Failed to delete some levels');
      }
    }
  };

  // Filter and sort levels
  const filteredAndSortedLevels = levels
    .filter(level =>
      level.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
      level.benefits.some(benefit => benefit.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'max_points') {
        aValue = aValue === Infinity ? 999999 : aValue;
        bValue = bValue === Infinity ? 999999 : bValue;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  if (loading || !initialized) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Reward Levels</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  setLoading(true);
                  fetchLevels();
                }}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Reward Level Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Level
          </button>
          {levels.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn-outline text-red-600 border-red-600 hover:bg-red-50 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete All
            </button>
          )}
        </div>
      </div>

      {/* Search and Sort Controls */}
      {levels.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search levels by name or benefits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-select"
              >
                <option value="min_points">Sort by Points</option>
                <option value="level">Sort by Name</option>
                <option value="created_at">Sort by Created Date</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="btn-outline px-3"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <svg className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">Rewards Given</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.total_rewards_given}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">Points Awarded</h3>
            <p className="text-2xl font-bold text-green-600">{stats.total_points_awarded}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">Active Levels</h3>
            <p className="text-2xl font-bold text-purple-600">{levels.length}</p>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingLevel ? 'Edit Reward Level' : 'Create New Reward Level'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level Name *
                </label>
                <input
                  type="text"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  placeholder="e.g., Gold Member"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Badge Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="badge_color"
                    value={formData.badge_color}
                    onChange={handleInputChange}
                    className="form-input w-16 h-10 p-1 rounded"
                  />
                  <input
                    type="text"
                    value={formData.badge_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, badge_color: e.target.value }))}
                    className="form-input flex-1"
                    placeholder="#95a5a6"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-textarea w-full"
                rows="2"
                placeholder="Brief description of this level..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Points
                </label>
                <input
                  type="number"
                  name="min_points"
                  value={formData.min_points}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Points (use 'inf' for infinity)
                </label>
                <input
                  type="text"
                  name="max_points"
                  value={formData.max_points}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  required
                />
              </div>
            </div>

            {/* Benefits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Benefits
              </label>
              {formData.benefits.map((benefit, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={benefit}
                    onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                    className="form-input flex-1"
                    placeholder="Enter benefit"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('benefits', index)}
                    className="btn-outline text-red-600 px-3"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('benefits')}
                className="btn-outline text-sm"
              >
                Add Benefit
              </button>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requirements
              </label>
              {formData.requirements.map((requirement, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={requirement}
                    onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                    className="form-input flex-1"
                    placeholder="Enter requirement"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('requirements', index)}
                    className="btn-outline text-red-600 px-3"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('requirements')}
                className="btn-outline text-sm"
              >
                Add Requirement
              </button>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editingLevel ? 'Update Level' : 'Create Level'}
              </button>
              <button type="button" onClick={resetForm} className="btn-outline">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Levels List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Current Reward Levels</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredAndSortedLevels && filteredAndSortedLevels.length > 0 ? filteredAndSortedLevels.map((level) => (
            <div key={level.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: level.badge_color }}
                    ></div>
                    <h4 className="text-lg font-semibold">{level.level}</h4>
                    <span className="text-sm text-gray-500">
                      {level.min_points} - {level.max_points === Infinity ? '∞' : level.max_points} points
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">Benefits:</h5>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {level.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    </div>

                    {level.requirements && level.requirements.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">Requirements:</h5>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {level.requirements.map((requirement, index) => (
                            <li key={index}>{requirement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {stats && stats.level_distribution && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">
                        Users at this level: {stats.level_distribution.find(d => d.level === level.level)?.user_count || 0}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(level)}
                    className="btn-outline text-sm flex items-center"
                    title="Edit Level"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDuplicate(level)}
                    className="btn-outline text-blue-600 text-sm flex items-center"
                    title="Duplicate Level"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                  <button
                    onClick={() => handleDelete(level.id)}
                    className="btn-outline text-red-600 text-sm flex items-center"
                    title="Delete Level"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-6 text-center text-gray-500">
              {searchTerm ? (
                <div>
                  <p>No levels found matching "{searchTerm}"</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-2 btn-outline text-sm"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div>
                  <p>No reward levels found.</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-2 btn-primary"
                  >
                    Create Your First Level
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardLevelManager;