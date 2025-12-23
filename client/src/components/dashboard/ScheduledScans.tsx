'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Globe, Plus, Trash2, Play, Pause, 
  CheckCircle, AlertCircle, Settings, ChevronDown 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ScheduledScan {
  id: string;
  url: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'error';
}

interface ScheduledScansProps {
  userId?: string;
  canSchedule?: boolean;
}

export default function ScheduledScans({ userId, canSchedule = true }: ScheduledScansProps) {
  const [scheduledScans, setScheduledScans] = useState<ScheduledScan[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newScan, setNewScan] = useState({
    url: '',
    frequency: 'weekly' as const,
    time: '09:00',
    dayOfWeek: 1,
    dayOfMonth: 1,
  });

  // Load scheduled scans from localStorage
  useEffect(() => {
    if (userId) {
      const saved = localStorage.getItem(`scheduled_scans_${userId}`);
      if (saved) {
        setScheduledScans(JSON.parse(saved));
      }
    }
  }, [userId]);

  // Save scheduled scans to localStorage
  const saveScans = (scans: ScheduledScan[]) => {
    if (userId) {
      localStorage.setItem(`scheduled_scans_${userId}`, JSON.stringify(scans));
    }
    setScheduledScans(scans);
  };

  const addScheduledScan = () => {
    if (!newScan.url) {
      toast.error('Please enter a URL');
      return;
    }

    // Basic URL validation
    let url = newScan.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const nextRun = calculateNextRun(newScan.frequency, newScan.time, newScan.dayOfWeek, newScan.dayOfMonth);

    const scan: ScheduledScan = {
      id: `scan_${Date.now()}`,
      url,
      frequency: newScan.frequency,
      time: newScan.time,
      dayOfWeek: newScan.dayOfWeek,
      dayOfMonth: newScan.dayOfMonth,
      enabled: true,
      nextRun,
      status: 'active',
    };

    saveScans([...scheduledScans, scan]);
    setNewScan({ url: '', frequency: 'weekly', time: '09:00', dayOfWeek: 1, dayOfMonth: 1 });
    setShowAddForm(false);
    toast.success('Scheduled scan created!');
  };

  const toggleScan = (id: string) => {
    const updated = scheduledScans.map(scan => {
      if (scan.id === id) {
        return { 
          ...scan, 
          enabled: !scan.enabled, 
          status: scan.enabled ? 'paused' as const : 'active' as const 
        };
      }
      return scan;
    });
    saveScans(updated);
    toast.success(updated.find(s => s.id === id)?.enabled ? 'Scan resumed' : 'Scan paused');
  };

  const deleteScan = (id: string) => {
    saveScans(scheduledScans.filter(scan => scan.id !== id));
    toast.success('Scheduled scan deleted');
  };

  const calculateNextRun = (frequency: string, time: string, dayOfWeek?: number, dayOfMonth?: number) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    if (frequency === 'weekly' && dayOfWeek !== undefined) {
      while (next.getDay() !== dayOfWeek) {
        next.setDate(next.getDate() + 1);
      }
    } else if (frequency === 'monthly' && dayOfMonth !== undefined) {
      next.setDate(dayOfMonth);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
    }

    return next.toISOString();
  };

  const getFrequencyLabel = (scan: ScheduledScan) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    switch (scan.frequency) {
      case 'daily':
        return `Daily at ${scan.time}`;
      case 'weekly':
        return `Every ${days[scan.dayOfWeek || 0]} at ${scan.time}`;
      case 'monthly':
        return `Monthly on day ${scan.dayOfMonth} at ${scan.time}`;
      default:
        return scan.frequency;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            Scheduled Scans
          </h2>
          <p className="text-gray-500 text-sm mt-1">Automate your security scans</p>
        </div>
        {canSchedule && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Schedule
          </button>
        )}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
              <h3 className="text-white font-medium mb-4">New Scheduled Scan</h3>
              
              <div className="space-y-4">
                {/* URL Input */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Website URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={newScan.url}
                      onChange={(e) => setNewScan({ ...newScan, url: e.target.value })}
                      placeholder="example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
                    />
                  </div>
                </div>

                {/* Frequency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Frequency</label>
                    <select
                      value={newScan.frequency}
                      onChange={(e) => setNewScan({ ...newScan, frequency: e.target.value as any })}
                      className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-sm"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Time</label>
                    <input
                      type="time"
                      value={newScan.time}
                      onChange={(e) => setNewScan({ ...newScan, time: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-sm"
                    />
                  </div>
                </div>

                {/* Day Selection */}
                {newScan.frequency === 'weekly' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Day of Week</label>
                    <select
                      value={newScan.dayOfWeek}
                      onChange={(e) => setNewScan({ ...newScan, dayOfWeek: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-sm"
                    >
                      <option value={0}>Sunday</option>
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                    </select>
                  </div>
                )}

                {newScan.frequency === 'monthly' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Day of Month</label>
                    <select
                      value={newScan.dayOfMonth}
                      onChange={(e) => setNewScan({ ...newScan, dayOfMonth: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-sm"
                    >
                      {Array.from({ length: 28 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addScheduledScan}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors"
                  >
                    Create Schedule
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scheduled Scans List */}
      {scheduledScans.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/30 border border-gray-800 rounded-xl">
          <Calendar className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No scheduled scans yet</p>
          <p className="text-gray-600 text-sm">Create a schedule to automatically scan your websites</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scheduledScans.map((scan) => (
            <motion.div
              key={scan.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gray-900/50 border rounded-xl p-4 transition-colors ${
                scan.enabled ? 'border-gray-800' : 'border-gray-800/50 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    scan.status === 'active' ? 'bg-emerald-500/20' :
                    scan.status === 'paused' ? 'bg-gray-500/20' :
                    'bg-red-500/20'
                  }`}>
                    {scan.status === 'active' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : scan.status === 'paused' ? (
                      <Pause className="w-5 h-5 text-gray-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-mono text-sm truncate">{scan.url}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getFrequencyLabel(scan)}
                      </span>
                      {scan.nextRun && (
                        <span className="text-xs text-emerald-500">
                          Next: {new Date(scan.nextRun).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleScan(scan.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      scan.enabled
                        ? 'bg-gray-800 text-gray-400 hover:text-white'
                        : 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30'
                    }`}
                    title={scan.enabled ? 'Pause' : 'Resume'}
                  >
                    {scan.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteScan(scan.id)}
                    className="p-2 bg-gray-800 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-emerald-400 font-medium text-sm">Pro Tip</p>
            <p className="text-gray-400 text-sm mt-1">
              Scheduled scans run automatically at your specified times. You'll receive email notifications with scan results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

