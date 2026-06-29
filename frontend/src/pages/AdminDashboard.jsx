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
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks', 'analytics', 'leaves'
  const [analytics, setAnalytics] = useState(null);
  
  // Leaves state
  const [leaves, setLeaves] = useState([]);
  const [reviewLeave, setReviewLeave] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  
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

  const addCustomField = () => {
    setCustomFields([...customFields, { name: '', type: 'text' }]);
  };

  const updateCustomField = (index, key, value) => {
    const newFields = [...customFields];
    newFields[index][key] = value;
    setCustomFields(newFields);
  };

  const removeCustomField = (index) => {
    const newFields = [...customFields];
    newFields.splice(index, 1);
    setCustomFields(newFields);
  };

  useEffect(() => {
    fetchTasks();
    fetchAnalytics();
    fetchLeaves();
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

  const fetchLeaves = async () => {
    try {
      const response = await api.get('/api/leaves/admin');
      setLeaves(response.data);
    } catch (err) {
      console.error('Failed to fetch leaves', err);
    }
  };

  const openAssignModal = async () => {
    setShowModal(true);
    setCustomFields([]);
    try {
      const empRes = await api.get('/api/users/employees');
      setEmployees(empRes.data);
    } catch (err) {
      console.error("Failed to load employees");
    }
  };

  const handleDepartmentChange = (e) => {
    const dept = e.target.value;
    setNewTask({...newTask, department: dept});
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const taskPayload = { ...newTask, custom_fields: customFields };
      await api.post('/api/tasks/', taskPayload);
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
      setCustomFields([]);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to assign task");
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

  const handleReviewLeave = async (status) => {
    if (!reviewLeave) return;
    setReviewing(true);
    try {
      await api.put(`/api/leaves/${reviewLeave._id || reviewLeave.id}/review`, {
        status,
        admin_remarks: adminRemarks
      });
      setReviewLeave(null);
      setAdminRemarks('');
      fetchLeaves();
    } catch (err) {
      alert("Failed to review leave");
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
              <button 
                onClick={() => setActiveTab('leaves')}
                className={`flex items-center px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'leaves' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Leave Requests
                {leaves.filter(l => l.status === 'Pending').length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {leaves.filter(l => l.status === 'Pending').length}
                  </span>
                )}
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
        ) : activeTab === 'leaves' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h2 className="font-semibold text-slate-800">Employee Leave Requests</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Employee</th>
                    <th className="px-6 py-3 font-medium">Dates</th>
                    <th className="px-6 py-3 font-medium">Reason</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No leave requests found.</td>
                    </tr>
                  ) : (
                    leaves.map((leave) => (
                      <tr key={leave.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{leave.employee_name}</td>
                        <td className="px-6 py-4">{leave.start_date} to {leave.end_date}</td>
                        <td className="px-6 py-4 max-w-xs truncate">{leave.reason}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => { setReviewLeave(leave); setAdminRemarks(leave.admin_remarks || ''); }}
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
                    <option value="auto" className="font-bold text-primary-700 bg-primary-50">✨ Auto Assign (Least Busy)</option>
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

              {/* Custom Fields Builder */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Custom Task Schema</h4>
                  <button type="button" onClick={addCustomField} className="text-xs font-medium text-primary-600 hover:text-primary-800">
                    + Add Field
                  </button>
                </div>
                {customFields.length > 0 ? (
                  <div className="space-y-3 mt-3">
                    {customFields.map((field, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          placeholder="Field Name" 
                          required
                          className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-primary-500" 
                          value={field.name} 
                          onChange={e => updateCustomField(i, 'name', e.target.value)} 
                        />
                        <select 
                          className="w-28 px-2 py-1 border border-slate-200 rounded text-sm bg-white focus:ring-1 focus:ring-primary-500"
                          value={field.type} 
                          onChange={e => updateCustomField(i, 'type', e.target.value)}
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                        </select>
                        <button type="button" onClick={() => removeCustomField(i)} className="text-red-500 hover:text-red-700 p-1">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-2">No custom fields added. Employees will only submit a proof image and remarks.</p>
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
                      {reviewTask.remarks || "No remarks provided."}
                    </p>
                  </div>
                  {reviewTask.proof_image && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Proof Uploaded</h4>
                      <div className="rounded-lg border border-slate-200 overflow-hidden relative group">
                        <img src={reviewTask.proof_image} alt="Proof" className="w-full h-48 object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={reviewTask.proof_image} target="_blank" rel="noreferrer" className="text-white text-sm font-medium hover:underline">
                            View Full Image
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {reviewTask.dynamic_data && Object.keys(reviewTask.dynamic_data).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Task Data Submitted</h4>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                        {Object.entries(reviewTask.dynamic_data).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center border-b border-slate-200/60 pb-1 last:border-0 last:pb-0">
                            <span className="text-xs font-medium text-slate-500">{key}</span>
                            <span className="text-sm text-slate-800 font-medium">{value.toString()}</span>
                          </div>
                        ))}
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

      {/* Review Leave Modal */}
      {reviewLeave && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-semibold text-slate-900">Review Leave Request</h2>
              <button onClick={() => setReviewLeave(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Employee</p>
                <p className="text-slate-900 font-semibold">{reviewLeave.employee_name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Start Date</p>
                  <p className="text-slate-800">{reviewLeave.start_date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">End Date</p>
                  <p className="text-slate-800">{reviewLeave.end_date}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Reason</p>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">{reviewLeave.reason}</p>
              </div>
              
              <div className="border-t border-slate-100 pt-4 mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin Remarks (Optional)</label>
                <textarea 
                  rows="2" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 mb-4"
                  placeholder="Reason for approval/rejection..."
                  value={adminRemarks} 
                  onChange={e => setAdminRemarks(e.target.value)}
                ></textarea>
                
                {reviewLeave.status === 'Pending' ? (
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleReviewLeave('Rejected')} 
                      disabled={reviewing}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleReviewLeave('Approved')} 
                      disabled={reviewing}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button 
                      onClick={() => setReviewLeave(null)} 
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
