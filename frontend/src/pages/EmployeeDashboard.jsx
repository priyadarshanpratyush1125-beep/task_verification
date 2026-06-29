import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { ClipboardList, CheckCircle2, Clock, AlertCircle, Upload, X, Bell } from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'completed', or 'leaves'
  
  // Leaves state
  const [leaves, setLeaves] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ start_date: '', end_date: '', reason: '' });
  const [dismissedNotifs, setDismissedNotifs] = useState(() => {
    return JSON.parse(localStorage.getItem('dismissedLeaves') || '[]');
  });

  const dismissNotification = (id) => {
    const newDismissed = [...dismissedNotifs, id];
    setDismissedNotifs(newDismissed);
    localStorage.setItem('dismissedLeaves', JSON.stringify(newDismissed));
  };
  
  // Modal state
  const [selectedTask, setSelectedTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [proofImage, setProofImage] = useState(null);
  const [remarks, setRemarks] = useState('');
  
  const [dynamicFields, setDynamicFields] = useState([]);
  const [dynamicData, setDynamicData] = useState({});
  
  // Daily popup state
  const [showDailyPopup, setShowDailyPopup] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchLeaves();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/tasks/employee');
      setTasks(response.data);
      setError('');
      
      // Show daily popup once per session if there are pending tasks
      if (!sessionStorage.getItem('dailyPopupShown')) {
        const pending = response.data.filter(t => t.status === 'Pending');
        if (pending.length > 0) {
          setShowDailyPopup(true);
          sessionStorage.setItem('dailyPopupShown', 'true');
        }
      }
      
    } catch (err) {
      console.error(err);
      setError('Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    try {
      const response = await api.get('/api/leaves/employee');
      setLeaves(response.data);
    } catch (err) {
      console.error("Failed to fetch leaves", err);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProofImage(e.target.files[0]);
    }
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (!proofImage) {
      alert("Please upload a proof image.");
      return;
    }
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('proof_image', proofImage);
      formData.append('remarks', remarks);
      formData.append('dynamic_data', JSON.stringify(dynamicData));

      await api.post(`/api/tasks/${selectedTask._id || selectedTask.id}/submit`, formData);
      
      // Refresh tasks
      await fetchTasks();
      closeModal();
    } catch (err) {
      console.error("Failed to submit task", err);
      alert("Failed to submit task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/leaves/', leaveForm);
      setShowLeaveModal(false);
      setLeaveForm({ start_date: '', end_date: '', reason: '' });
      fetchLeaves();
      alert("Leave request submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = async (task) => {
    setSelectedTask(task);
    setProofImage(null);
    setRemarks(task.remarks || '');
    setDynamicData(task.dynamic_data || {});
    
    if (task.custom_fields && task.custom_fields.length > 0) {
      setDynamicFields(task.custom_fields);
    } else {
      // Fetch dynamic fields for department as fallback for older tasks
      try {
        const res = await api.get(`/api/fields/${task.department}`);
        setDynamicFields(res.data.fields || []);
      } catch (err) {
        console.error("Failed to fetch dynamic fields", err);
        setDynamicFields([]);
      }
    }
  };

  const closeModal = () => {
    setSelectedTask(null);
    setProofImage(null);
    setRemarks('');
    setDynamicFields([]);
    setDynamicData({});
  };

  const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'Rejected');
  const completedTasks = tasks.filter(t => t.status === 'Submitted' || t.status === 'Approved');
  const displayedTasks = activeTab === 'pending' ? pendingTasks : completedTasks;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name || 'Employee'}</h1>
            <p className="text-sm text-slate-500 mt-1">Here is your daily task breakdown.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm w-fit">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'pending' ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending Action ({pendingTasks.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'completed' ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed / History ({completedTasks.length})
              </button>
              <button
                onClick={() => setActiveTab('leaves')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'leaves' ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Leaves
              </button>
            </div>
            
            {/* Request Leave Button */}
            <button 
              onClick={() => setShowLeaveModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
            >
              Request Leave
            </button>
            
            {/* Profile Link */}
            <a 
              href="/profile"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
              title="My Profile"
            >
              <span className="font-semibold text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </a>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center text-sm border border-red-100">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Notifications */}
        {leaves.filter(l => l.status !== 'Pending' && !dismissedNotifs.includes(l.id || l._id)).map(leave => (
          <div key={`notif-${leave.id || leave._id}`} className={`mb-6 p-4 rounded-lg flex items-start justify-between text-sm border shadow-sm ${leave.status === 'Approved' ? 'bg-green-50 text-green-900 border-green-200' : 'bg-red-50 text-red-900 border-red-200'}`}>
            <div className="flex items-start">
              <Bell className={`w-5 h-5 mr-3 mt-0.5 ${leave.status === 'Approved' ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <h4 className="font-semibold mb-1">Leave Request {leave.status}</h4>
                <p>Your leave request for <strong>{leave.start_date}</strong> to <strong>{leave.end_date}</strong> has been <strong>{leave.status}</strong> by the admin.</p>
                {leave.admin_remarks && <p className="mt-1 italic text-slate-600">Remarks: {leave.admin_remarks}</p>}
              </div>
            </div>
            <button onClick={() => dismissNotification(leave.id || leave._id)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}

        {/* Dynamic Content */}
        {activeTab === 'leaves' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">My Leave Requests</h2>
            {leaves.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">You have no leave requests.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium">Dates</th>
                      <th className="px-4 py-3 font-medium">Reason</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Admin Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map(leave => (
                      <tr key={leave.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 whitespace-nowrap">{leave.start_date} to {leave.end_date}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{leave.reason}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(leave.status)}`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 italic text-xs">{leave.admin_remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : displayedTasks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <ClipboardList className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">No tasks found</h3>
                <p className="text-slate-500 text-sm">
                  {activeTab === 'pending' ? "You're all caught up! No pending tasks assigned." : "No completed tasks yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedTasks.map((task) => (
                  <div 
                    key={task._id || task.id} 
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => openModal(task)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        {task.department}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-slate-900 text-lg mb-2 group-hover:text-primary-600 transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                      {task.description}
                    </p>
                    
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-auto">
                      <div className="flex items-center text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        Priority: <span className="font-medium ml-1 text-slate-700">{task.priority}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openModal(task); }}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h2 className="text-xl font-semibold text-slate-900">Task Details</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg text-slate-900">{selectedTask.title}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status}
                  </span>
                </div>
                <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedTask.description}
                </p>
              </div>

              {selectedTask.status === 'Rejected' && selectedTask.admin_remarks && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex items-center text-red-800 font-semibold text-sm mb-1">
                    <AlertCircle className="w-4 h-4 mr-1.5" /> Admin Rejection Reason:
                  </div>
                  <p className="text-sm text-red-700 ml-5">{selectedTask.admin_remarks}</p>
                </div>
              )}

              {/* Read Only View for Completed Tasks */}
              {(selectedTask.status === 'Submitted' || selectedTask.status === 'Approved') ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Your Remarks</h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {selectedTask.remarks || "No remarks provided."}
                    </p>
                  </div>
                  
                  {/* Read Only Dynamic Data */}
                  {selectedTask.dynamic_data && Object.keys(selectedTask.dynamic_data).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Form Data</h4>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm space-y-2 text-slate-600">
                        {Object.entries(selectedTask.dynamic_data).map(([key, val]) => (
                          <div key={key}>
                            <span className="font-medium text-slate-800">{key}:</span> {val}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTask.proof_image && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Proof Uploaded</h4>
                      <div className="rounded-lg border border-slate-200 overflow-hidden relative group">
                        <img src={selectedTask.proof_image} alt="Proof" className="w-full h-48 object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={selectedTask.proof_image} target="_blank" rel="noreferrer" className="text-white text-sm font-medium hover:underline">
                            View Full Image
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedTask.admin_remarks && selectedTask.status === 'Approved' && (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                      <h4 className="text-sm font-semibold text-green-800 mb-1">Admin Approval Note:</h4>
                      <p className="text-sm text-green-700">{selectedTask.admin_remarks}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Submission Form for Pending/Rejected Tasks */
                <form onSubmit={handleSubmitTask} className="space-y-4 border-t border-slate-100 pt-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Proof Image</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-slate-400" />
                        <div className="flex text-sm text-slate-600 justify-center">
                          <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                            <span>Upload a file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} required />
                          </label>
                        </div>
                        <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                    {proofImage && <p className="mt-2 text-sm text-green-600 font-medium flex items-center"><CheckCircle2 className="w-4 h-4 mr-1"/> Selected: {proofImage.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Completion Remarks</label>
                    <textarea 
                      required 
                      rows="3" 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      placeholder="Describe the work done..."
                      value={remarks} 
                      onChange={e => setRemarks(e.target.value)}
                    ></textarea>
                  </div>

                  {dynamicFields.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-sm font-medium text-slate-700 mb-3">Required Custom Fields</h4>
                      <div className="space-y-3">
                        {dynamicFields.map((field, idx) => (
                          <div key={idx}>
                            <label className="block text-xs font-medium text-slate-600 mb-1">{field.name}</label>
                            <input 
                              required 
                              type={field.type === 'number' ? 'number' : 'text'} 
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                              value={dynamicData[field.name] || ''}
                              onChange={e => setDynamicData({...dynamicData, [field.name]: e.target.value})}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-6">
                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:bg-primary-400 flex items-center"
                    >
                      {submitting ? 'Submitting...' : 'Submit Task'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">Request Leave</h2>
              <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitLeave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input required type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" 
                    value={leaveForm.start_date} onChange={e => setLeaveForm({...leaveForm, start_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input required type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" 
                    value={leaveForm.end_date} onChange={e => setLeaveForm({...leaveForm, end_date: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Leave</label>
                <textarea required rows="3" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowLeaveModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Daily Tasks Popup Modal */}
      {showDailyPopup && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-black opacity-10 rounded-full blur-xl"></div>
              
              <div className="relative w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-inner">
                <ClipboardList className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white relative">Daily Task Briefing</h2>
              <p className="text-primary-100 mt-1 text-sm relative">Here's what you need to focus on today</p>
            </div>
            
            <div className="p-6 max-h-[50vh] overflow-y-auto bg-slate-50/50">
              {pendingTasks.length > 0 ? (
                <ul className="space-y-3">
                  {pendingTasks.map(t => (
                    <li key={t.id || t._id} className="flex items-start p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="bg-primary-50 p-2.5 rounded-lg mr-4 text-primary-600">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{t.title}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            t.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' :
                            t.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                            'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}>
                            {t.priority}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">
                            {t.department}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">You're all caught up for today!</p>
                </div>
              )}
            </div>
            <div className="p-5 bg-white border-t border-slate-100 text-center">
              <button 
                onClick={() => setShowDailyPopup(false)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold shadow-md hover:bg-primary-600 transition-all hover:shadow-lg focus:ring-4 focus:ring-primary-500/20 active:scale-[0.98]"
              >
                Let's Get to Work
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeDashboard;
