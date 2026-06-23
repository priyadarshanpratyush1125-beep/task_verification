import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Plus, Search, Filter, AlertCircle, CheckCircle, Clock, XCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tabs and Analytics state
  const [activeTab, setActiveTab] = useState('tasks');
  const [analytics, setAnalytics] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [dynamicFields, setDynamicFields] = useState([]);
  
  // Review state
  const [reviewTask, setReviewTask] = useState(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [reviewing, setReviewing] = useState(false);
  
  // Form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    department: 'Maintenance',
    priority: 'Medium'
  });

  useEffect(() => {
    fetchTasks();
    fetchAnalytics();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/tasks/admin');
      setTasks(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/api/analytics/summary');
      setAnalytics(response.data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    }
  };

  const openAssignModal = async () => {
    setShowModal(true);
    try {
      const empRes = await api.get('/api/users/employees');
      setEmployees(empRes.data);
      fetchDynamicFields(newTask.department);
    } catch (err) {
      console.error("Failed to load employees");
    }
  };

  const fetchDynamicFields = async (dept) => {
    try {
      const res = await api.get(`/api/fields/${dept}`);
      setDynamicFields(res.data.fields || []);
    } catch (err) {
      setDynamicFields([]);
    }
  };

  const handleDepartmentChange = (e) => {
    const dept = e.target.value;
    setNewTask({...newTask, department: dept});
    fetchDynamicFields(dept);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/tasks', newTask);
      setShowModal(false);
      fetchTasks();
      fetchAnalytics();
      setNewTask({
        title: '',
        description: '',
        assigned_to: '',
        department: 'Maintenance',
        priority: 'Medium'
      });
    } catch (err) {
      alert("Failed to assign task");
    }
  };

  const handleReviewTask = async (status) => {
    if (!reviewTask) return;
    setReviewing(true);
    try {
      await api.put(`/api/tasks/${reviewTask._id || reviewTask.id}/review`, {
        status,
        admin_remarks: adminRemarks
      });
      setReviewTask(null);
      setAdminRemarks('');
      fetchTasks();
      fetchAnalytics();
    } catch (err) {
      alert("Failed to review task");
    } finally {
      setReviewing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Submitted': return 'bg-blue-100 text-blue-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Supervisor Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Manage tasks and monitor operational efficiency.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Tabs */}
            <div className="flex bg-slate-200 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'tasks' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Tasks Overview
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'analytics' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <BarChart3 className="w-4 h-4 mr-1.5" />
                Analytics
              </button>
            </div>

            <button 
              onClick={openAssignModal}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Assign New Task
            </button>
            
            {/* Profile Link */}
            <a 
              href="/profile"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
              title="My Profile"
            >
              <span className="font-semibold text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </a>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center text-sm">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Dynamic Content Area */}
        {activeTab === 'tasks' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-semibold text-slate-800">All Tasks Overview</h2>
              <div className="flex gap-2 text-sm">
                <button className="flex items-center px-3 py-1.5 text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50">
                  <Filter className="w-3.5 h-3.5 mr-1.5" /> Filter
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Task ID</th>
                    <th className="px-6 py-3 font-medium">Title & Dept</th>
                    <th className="px-6 py-3 font-medium">Priority</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading tasks...</td>
                    </tr>
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No tasks assigned yet.</td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task._id || task.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          {task._id ? task._id.substring(0, 8) : (task.id ? task.id.substring(0, 8) : 'N/A')}...
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{task.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{task.department}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-700">{task.priority}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => { setReviewTask(task); setAdminRemarks(task.admin_remarks || ''); }}
                            className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Analytics Dashboard View */
          <div className="space-y-6">
            {!analytics ? (
              <div className="p-8 text-center text-slate-500">Loading analytics...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Tasks</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics.total_tasks}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Completion Rate</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics.completion_rate}%</h3>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Pending</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics.status_counts.Pending || 0}</h3>
                    </div>
                    <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Rejected</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics.status_counts.Rejected || 0}</h3>
                    </div>
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                      <XCircle className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Department Breakdown Chart */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Tasks by Department</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.department_breakdown}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                          <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                          />
                          <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Status Distribution Pie Chart */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Task Status Distribution</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Pending', value: analytics.status_counts.Pending || 0 },
                              { name: 'Submitted', value: analytics.status_counts.Submitted || 0 },
                              { name: 'Approved', value: analytics.status_counts.Approved || 0 },
                              { name: 'Rejected', value: analytics.status_counts.Rejected || 0 },
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            <Cell fill="#eab308" /> {/* Pending */}
                            <Cell fill="#3b82f6" /> {/* Submitted */}
                            <Cell fill="#22c55e" /> {/* Approved */}
                            <Cell fill="#ef4444" /> {/* Rejected */}
                          </Pie>
                          <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-4 mt-4 text-sm text-slate-600">
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>Pending</div>
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>Submitted</div>
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>Approved</div>
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>Rejected</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* Assign Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">Assign New Task</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" 
                  value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea required rows="3" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                  <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    value={newTask.assigned_to} onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}>
                    <option value="" disabled>Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.department || 'General'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  value={newTask.department} onChange={handleDepartmentChange}>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              {/* Dynamic Fields Preview */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 mt-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Required Proof Fields (Preview)</h4>
                {dynamicFields.length > 0 ? (
                  <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                    {dynamicFields.map((field, i) => (
                      <li key={i}>{field.name} <span className="text-slate-400 text-xs">({field.type})</span></li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">No dynamic fields configured for this department yet.</p>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Task Modal */}
      {reviewTask && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0">
              <h2 className="text-xl font-semibold text-slate-900">Review Task</h2>
              <button onClick={() => setReviewTask(null)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 shadow-sm">✕</button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg text-slate-900">{reviewTask.title}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(reviewTask.status)}`}>
                    {reviewTask.status}
                  </span>
                </div>
                <p className="text-slate-600 text-sm">{reviewTask.description}</p>
              </div>

              {reviewTask.status === 'Submitted' || reviewTask.status === 'Approved' ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Employee Remarks</h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {reviewTask.completion_remarks || "No remarks provided."}
                    </p>
                  </div>
                  {reviewTask.proof_image_url && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Proof Uploaded</h4>
                      <div className="rounded-lg border border-slate-200 overflow-hidden relative group">
                        <img src={reviewTask.proof_image_url} alt="Proof" className="w-full h-48 object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={reviewTask.proof_image_url} target="_blank" rel="noreferrer" className="text-white text-sm font-medium hover:underline">
                            View Full Image
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {reviewTask.status === 'Submitted' && (
                    <div className="border-t border-slate-100 pt-4 mt-6">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor Remarks (Optional)</label>
                      <textarea 
                        rows="2" 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 mb-4"
                        placeholder="Add notes for the employee..."
                        value={adminRemarks} 
                        onChange={e => setAdminRemarks(e.target.value)}
                      ></textarea>
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleReviewTask('Rejected')} 
                          disabled={reviewing}
                          className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleReviewTask('Approved')} 
                          disabled={reviewing}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  )}

                  {reviewTask.status === 'Approved' && reviewTask.admin_remarks && (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                      <h4 className="text-sm font-semibold text-green-800 mb-1">Your Approval Note:</h4>
                      <p className="text-sm text-green-700">{reviewTask.admin_remarks}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-slate-500 text-sm">This task has not been submitted by the employee yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
