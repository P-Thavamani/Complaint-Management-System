import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from '../services/axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

// ─── SVG Icons (matching the app theme, no emojis) ───────────────────────────
const Icons = {
  clipboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  wrench: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  available: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  timer: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  folder: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  ),
  calendar: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  user: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  inbox: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  arrowUp: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  ),
  checkSmall: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  eye: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  handRaise: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
    </svg>
  ),
};

// ─── Status & Priority helpers ────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:      'bg-yellow-100 text-yellow-800 border-yellow-200',
  'in-progress':'bg-blue-100 text-blue-800 border-blue-200',
  resolved:     'bg-green-100 text-green-800 border-green-200',
  escalated:    'bg-red-100 text-red-800 border-red-200',
};

const PRIORITY_STYLES = {
  low:    'text-green-600 bg-green-50',
  medium: 'text-yellow-700 bg-yellow-50',
  high:   'text-orange-600 bg-orange-50',
  urgent: 'text-red-600 bg-red-50',
};

const PRIORITY_DOT = {
  low:    'bg-green-500',
  medium: 'bg-yellow-500',
  high:   'bg-orange-500',
  urgent: 'bg-red-500',
};

// ─── StatCard component ───────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, colorClass, bgClass, borderClass }) => (
  <div className={`rounded-lg border ${borderClass} ${bgClass} p-4 flex items-center gap-3`}>
    <div className={`rounded-lg p-2 ${colorClass} bg-white bg-opacity-70`}>
      {icon}
    </div>
    <div>
      <div className="text-xl font-bold text-gray-800">{value ?? 0}</div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
    </div>
  </div>
);

// ─── ComplaintCard component ──────────────────────────────────────────────────
const ComplaintCard = ({ complaint, onClaim, onResolve, onEscalate, isAssigned }) => {
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [resolution, setResolution] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResolve = async () => {
    if (!resolution.trim()) { toast.error('Please provide a resolution note.'); return; }
    setIsSubmitting(true);
    await onResolve(complaint._id || complaint.id, resolution);
    setIsSubmitting(false);
    setShowResolveForm(false);
  };

  const handleEscalate = async () => {
    if (!escalateReason.trim()) { toast.error('Please provide an escalation reason.'); return; }
    setIsSubmitting(true);
    await onEscalate(complaint._id || complaint.id, escalateReason);
    setIsSubmitting(false);
    setShowEscalateForm(false);
  };

  const id = complaint._id || complaint.id;
  const status = complaint.status || 'pending';
  const priority = complaint.priority || 'medium';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{complaint.subject || 'No subject'}</h3>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{complaint.description || ''}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {status.replace('-', ' ')}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${PRIORITY_STYLES[priority] || 'text-gray-600 bg-gray-50'}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[priority] || 'bg-gray-400'}`}></span>
            {priority}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-4 border-t border-gray-100 pt-3">
        <span className="flex items-center gap-1">{Icons.folder} {complaint.category || 'General'}</span>
        {complaint.createdAt && (
          <span className="flex items-center gap-1">{Icons.calendar} {new Date(complaint.createdAt).toLocaleDateString()}</span>
        )}
        {complaint.user && (
          <span className="flex items-center gap-1">{Icons.user} {complaint.user.name || complaint.user}</span>
        )}
      </div>

      {/* Claim button (Available tab) */}
      {!isAssigned && status === 'pending' && (
        <button
          onClick={() => onClaim(id)}
          className="w-full py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
        >
          {Icons.handRaise}
          Claim This Ticket
        </button>
      )}

      {/* Assigned actions */}
      {isAssigned && (
        <div className="space-y-2">
          {!showResolveForm && !showEscalateForm && (
            <div className="flex gap-2">
              <Link
                to={`/worker/complaints/${id}`}
                className="flex-1 py-2 bg-gray-100 text-gray-700 text-xs text-center font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
              >
                {Icons.eye} Details
              </Link>
              {status !== 'resolved' && status !== 'escalated' && (
                <>
                  <button
                    onClick={() => { setShowResolveForm(true); setShowEscalateForm(false); }}
                    className="flex-1 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                  >
                    {Icons.checkSmall} Resolve
                  </button>
                  <button
                    onClick={() => { setShowEscalateForm(true); setShowResolveForm(false); }}
                    className="flex-1 py-2 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-1"
                  >
                    {Icons.arrowUp} Escalate
                  </button>
                </>
              )}
            </div>
          )}

          {showResolveForm && (
            <div className="space-y-2">
              <textarea
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                placeholder="Describe the resolution..."
                className="w-full text-sm p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button onClick={handleResolve} disabled={isSubmitting}
                  className="flex-1 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1">
                  {Icons.checkSmall} {isSubmitting ? 'Submitting...' : 'Confirm Resolve'}
                </button>
                <button onClick={() => setShowResolveForm(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showEscalateForm && (
            <div className="space-y-2">
              <textarea
                value={escalateReason}
                onChange={e => setEscalateReason(e.target.value)}
                placeholder="Reason for escalation..."
                className="w-full text-sm p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button onClick={handleEscalate} disabled={isSubmitting}
                  className="flex-1 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-1">
                  {Icons.arrowUp} {isSubmitting ? 'Submitting...' : 'Confirm Escalate'}
                </button>
                <button onClick={() => setShowEscalateForm(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main WorkerDashboard page ────────────────────────────────────────────────
const WorkerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assigned');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [complaintsRes, statsRes] = await Promise.allSettled([
        axios.get('/api/complaints/worker'),
        axios.get('/api/complaints/worker/stats'),
      ]);
      if (complaintsRes.status === 'fulfilled') setComplaints(complaintsRes.value.data || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data || {});
    } catch (err) {
      console.error('Error fetching worker data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleClaim = async (complaintId) => {
    try {
      await axios.post(`/api/complaints/${complaintId}/claim`);
      toast.success('Ticket claimed successfully.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to claim ticket');
    }
  };

  const handleResolve = async (complaintId, resolution) => {
    try {
      await axios.put(`/api/worker/complaints/${complaintId}/update`, {
        status: 'resolved', resolution, comment: `Resolved: ${resolution}`,
      });
      toast.success('Ticket marked as resolved.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resolve ticket');
    }
  };

  const handleEscalate = async (complaintId, reason) => {
    try {
      await axios.post(`/api/complaints/${complaintId}/escalate`, { reason });
      toast.success('Ticket escalated to admin.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to escalate ticket');
    }
  };

  const assignedComplaints = complaints.filter(c => c.assigned_to);
  const availableComplaints = complaints.filter(c => !c.assigned_to);
  const displayComplaints = activeTab === 'assigned' ? assignedComplaints : availableComplaints;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-primary-600"></div>
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Worker Dashboard</h1>
          {user && (
            <p className="text-sm text-gray-500 mt-1">
              Welcome back, <span className="font-semibold text-primary-600">{user.name}</span>
              {user.department && <span className="text-gray-400"> · {user.department}</span>}
              {user.skills && user.skills.length > 0 && (
                <span className="ml-2">
                  {user.skills.map(s => (
                    <span key={s} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100 mr-1">
                      {s}
                    </span>
                  ))}
                </span>
              )}
            </p>
          )}
        </div>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <span className={refreshing ? 'animate-spin' : ''}>{Icons.refresh}</span>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* ── Stats Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Assigned" value={stats.assigned} icon={Icons.clipboard}
          colorClass="text-primary-600" bgClass="bg-primary-50" borderClass="border-primary-100" />
        <StatCard label="Pending" value={stats.pending} icon={Icons.clock}
          colorClass="text-yellow-600" bgClass="bg-yellow-50" borderClass="border-yellow-100" />
        <StatCard label="In Progress" value={stats.inProgress} icon={Icons.wrench}
          colorClass="text-blue-600" bgClass="bg-blue-50" borderClass="border-blue-100" />
        <StatCard label="Resolved" value={stats.resolved} icon={Icons.check}
          colorClass="text-green-600" bgClass="bg-green-50" borderClass="border-green-100" />
        <StatCard label="Available" value={stats.available} icon={Icons.available}
          colorClass="text-purple-600" bgClass="bg-purple-50" borderClass="border-purple-100" />
        <StatCard
          label="Avg. Resolution"
          value={stats.avgResolutionTime ? `${stats.avgResolutionTime}h` : 'N/A'}
          icon={Icons.timer}
          colorClass="text-gray-500" bgClass="bg-gray-50" borderClass="border-gray-200"
        />
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'assigned'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Tasks
            {assignedComplaints.length > 0 && (
              <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                activeTab === 'assigned' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {assignedComplaints.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'available'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Available Tickets
            {availableComplaints.length > 0 && (
              <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                activeTab === 'available' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {availableComplaints.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* ── Complaint Cards / Empty State ──────────────────────────────────── */}
      {displayComplaints.length === 0 ? (
        <div className="text-center py-16">
          <div className="flex justify-center mb-4 text-gray-300">{Icons.inbox}</div>
          <p className="text-gray-500 font-medium">
            {activeTab === 'assigned'
              ? 'No tasks assigned to you yet.'
              : 'No available tickets right now.'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {activeTab === 'assigned'
              ? 'Switch to the Available Tickets tab to claim a ticket.'
              : 'Check back later or ask your admin to assign tasks.'}
          </p>
          {activeTab === 'assigned' && (
            <button
              onClick={() => setActiveTab('available')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
            >
              View Available Tickets
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayComplaints.map(complaint => (
            <ComplaintCard
              key={complaint._id || complaint.id}
              complaint={complaint}
              isAssigned={activeTab === 'assigned'}
              onClaim={handleClaim}
              onResolve={handleResolve}
              onEscalate={handleEscalate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;