'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Shield, Users, BarChart3, DollarSign, Activity, Search, 
  Trash2, CheckCircle, TrendingUp, Calendar, 
  RefreshCw, AlertTriangle, Globe, Crown, Star, Zap, 
  ArrowLeft, FileJson, FileSpreadsheet, Database, Loader2, Tag,
  ChevronRight, Download, Eye
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useScanLimits } from '@/hooks/useScanLimits';
import Navigation from '@/components/landing/Navigation';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  getAllUsers, 
  getAllScans, 
  getRevenueStats, 
  UserProfile,
  ScanRecord,
  getAllTestimonials,
  approveTestimonial,
  deleteTestimonial,
  Testimonial
} from '@/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { isAdmin as checkIsAdmin } from '@/config/admin';

type TabType = 'overview' | 'users' | 'scans' | 'revenue' | 'testimonials';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Data from Firestore
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [filteredScans, setFilteredScans] = useState<ScanRecord[]>([]);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [revenueStats, setRevenueStats] = useState<{
    totalRevenue: number;
    thisMonthRevenue: number;
    lastMonthRevenue: number;
    subscriptionsByPlan: { essential: number; cloud: number; pro: number; enterprise: number };
  } | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Get all unique tags from scans
  const getAllTagsFromScans = () => {
    const tagSet = new Set<string>();
    scans.forEach(scan => {
      const tags = (scan as ScanRecord & { tags?: string[] }).tags || [];
      tags.forEach((tag: string) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  // Apply tag filter
  useEffect(() => {
    if (scans.length === 0) return;
    if (selectedTagFilter === 'all') {
      setFilteredScans(scans);
    } else {
      const filtered = scans.filter(scan => {
        const tags = (scan as ScanRecord & { tags?: string[] }).tags || [];
        return tags.includes(selectedTagFilter);
      });
      setFilteredScans(filtered);
    }
  }, [selectedTagFilter, scans]);

  // Load testimonials
  const loadTestimonials = async () => {
    try {
      const testimonialsData = await getAllTestimonials();
      setTestimonials(testimonialsData);
    } catch (error) {
      console.error('Error loading testimonials:', error);
    }
  };

  // Load data from Firestore
  const loadData = async () => {
    setIsLoading(true);
    setFirestoreError(null);
    
    try {
      const [usersData, scansData, revenue] = await Promise.all([
        getAllUsers(),
        getAllScans(100),
        getRevenueStats(),
      ]);
      
      setUsers(usersData);
      setScans(scansData);
      setFilteredScans(scansData);
      setRevenueStats(revenue);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      setFirestoreError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/admin');
      return;
    }

    if (user?.email) {
      const adminCheck = checkIsAdmin(user.email);
      setIsAdmin(adminCheck);

      if (!adminCheck) {
        toast.error('Access denied. Admin privileges required.');
        router.push('/dashboard');
        return;
      }

      loadData();
    }
  }, [user, authLoading, isAuthenticated, router]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    if (activeTab === 'testimonials') await loadTestimonials();
    setIsRefreshing(false);
    toast.success('Data refreshed!');
  };

  // Export functions
  const exportToJSON = (data: unknown[], filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}.json`);
  };

  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) { toast.error('No data to export'); return; }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        let value = row[h];
        if (value && typeof value === 'object' && 'toDate' in (value as object)) {
          value = (value as Timestamp).toDate().toISOString();
        }
        if (Array.isArray(value)) value = value.join('; ');
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}.csv`);
  };

  const formatDate = (timestamp: Timestamp | Date | string | undefined): string => {
    if (!timestamp) return '-';
    try {
      if (timestamp instanceof Timestamp) return format(timestamp.toDate(), 'MMM dd, yyyy');
      if (timestamp instanceof Date) return format(timestamp, 'MMM dd, yyyy');
      return format(new Date(timestamp), 'MMM dd, yyyy');
    } catch { return '-'; }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) return null;

  // Calculate stats
  const totalUsers = users.length;
  const totalScans = scans.length;
  const avgScore = scans.length > 0 ? Math.round(scans.reduce((sum, s) => sum + s.score, 0) / scans.length) : 0;
  const proUsers = users.filter(u => u.plan === 'pro').length;
  const enterpriseUsers = users.filter(u => u.plan === 'enterprise').length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3, count: null },
    { id: 'users', label: 'Users', icon: Users, count: totalUsers },
    { id: 'scans', label: 'Scans', icon: Search, count: totalScans },
    { id: 'revenue', label: 'Revenue', icon: DollarSign, count: null },
    { id: 'testimonials', label: 'Reviews', icon: Star, count: testimonials.length },
  ];

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Navigation />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-dark-secondary rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                Admin Dashboard
              </h1>
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <Database className="w-3 h-3" />
                Real-time Firestore data
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-dark-secondary border border-dark-accent rounded-xl text-gray-300 hover:border-yellow-500/50 transition-colors flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error Banner */}
        {firestoreError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-medium">Error loading data</p>
              <p className="text-gray-500 text-sm">{firestoreError}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
          </div>
        )}

        {!isLoading && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
              <div className="bg-dark-secondary border border-dark-accent rounded-xl p-4">
                <Users className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-2xl font-bold text-white">{totalUsers}</p>
                <p className="text-xs text-gray-500">Total Users</p>
              </div>
              <div className="bg-dark-secondary border border-dark-accent rounded-xl p-4">
                <Activity className="w-5 h-5 text-purple-400 mb-2" />
                <p className="text-2xl font-bold text-white">{totalScans}</p>
                <p className="text-xs text-gray-500">Total Scans</p>
              </div>
              <div className="bg-dark-secondary border border-dark-accent rounded-xl p-4">
                <Shield className="w-5 h-5 text-green-400 mb-2" />
                <p className="text-2xl font-bold text-white">{avgScore || '-'}</p>
                <p className="text-xs text-gray-500">Avg Score</p>
              </div>
              <div className="bg-dark-secondary border border-purple-500/30 rounded-xl p-4">
                <Star className="w-5 h-5 text-purple-400 mb-2" />
                <p className="text-2xl font-bold text-purple-400">{proUsers}</p>
                <p className="text-xs text-gray-500">Pro Users</p>
              </div>
              <div className="bg-dark-secondary border border-yellow-500/30 rounded-xl p-4">
                <Crown className="w-5 h-5 text-yellow-400 mb-2" />
                <p className="text-2xl font-bold text-yellow-400">{enterpriseUsers}</p>
                <p className="text-xs text-gray-500">Enterprise Users</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={async () => {
                    setActiveTab(tab.id as TabType);
                    if (tab.id === 'testimonials') await loadTestimonials();
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-yellow-500 text-black'
                      : 'text-gray-400 hover:text-white hover:bg-dark-secondary'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== null && (
                    <span className={`px-1.5 py-0.5 rounded text-xs ${activeTab === tab.id ? 'bg-black/20' : 'bg-dark-accent'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="bg-dark-secondary border border-dark-accent rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-dark-accent flex items-center justify-between">
                    <h3 className="text-white font-semibold">Recent Users</h3>
                    <button onClick={() => setActiveTab('users')} className="text-yellow-500 text-sm flex items-center gap-1 hover:text-yellow-400">
                      View All <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  {users.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No users yet</div>
                  ) : (
                    <div className="divide-y divide-dark-accent">
                      {users.slice(0, 5).map(u => (
                        <div key={u.uid} className="p-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-dark-accent flex items-center justify-center overflow-hidden relative">
                            {u.photoURL ? (
                              <Image src={u.photoURL} alt={u.displayName || 'User'} fill className="rounded-full object-cover" sizes="32px" />
                            ) : (
                              <span className="text-gray-400 text-xs">{u.email?.[0]?.toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{u.displayName || 'User'}</p>
                            <p className="text-gray-500 text-xs truncate">{u.email}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            u.plan === 'enterprise' ? 'bg-yellow-500/20 text-yellow-400' :
                            u.plan === 'pro' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {(u.plan || 'free').toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Scans */}
                <div className="bg-dark-secondary border border-dark-accent rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-dark-accent flex items-center justify-between">
                    <h3 className="text-white font-semibold">Recent Scans</h3>
                    <button onClick={() => setActiveTab('scans')} className="text-yellow-500 text-sm flex items-center gap-1 hover:text-yellow-400">
                      View All <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  {scans.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No scans yet</div>
                  ) : (
                    <div className="divide-y divide-dark-accent">
                      {scans.slice(0, 5).map(scan => (
                        <div key={scan.id} className="p-3 flex items-center gap-3">
                          <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-mono truncate">{scan.url}</p>
                            <p className="text-gray-500 text-xs">{formatDate(scan.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${scan.score >= 80 ? 'text-green-500' : scan.score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                              {scan.score}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                              scan.grade.startsWith('A') ? 'bg-green-500/20 text-green-400' :
                              scan.grade === 'B' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {scan.grade}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Revenue Summary */}
                <div className="bg-dark-secondary border border-dark-accent rounded-xl p-6 lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-semibold">Revenue Overview</h3>
                    <button onClick={() => setActiveTab('revenue')} className="text-yellow-500 text-sm flex items-center gap-1 hover:text-yellow-400">
                      Details <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-dark-primary rounded-xl p-4 text-center">
                      <DollarSign className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">${revenueStats?.totalRevenue.toLocaleString() || '0'}</p>
                      <p className="text-xs text-gray-500">Total Revenue</p>
                    </div>
                    <div className="bg-dark-primary rounded-xl p-4 text-center border border-green-500/20">
                      <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-400">${revenueStats?.thisMonthRevenue.toLocaleString() || '0'}</p>
                      <p className="text-xs text-gray-500">This Month</p>
                    </div>
                    <div className="bg-dark-primary rounded-xl p-4 text-center">
                      <Calendar className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">${revenueStats?.lastMonthRevenue.toLocaleString() || '0'}</p>
                      <p className="text-xs text-gray-500">Last Month</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-dark-secondary border border-dark-accent rounded-xl overflow-hidden">
                <div className="p-4 border-b border-dark-accent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h3 className="text-white font-semibold">All Users ({totalUsers})</h3>
                  {users.length > 0 && (
                    <div className="flex gap-2">
                      <button onClick={() => exportToCSV(users as unknown as Record<string, unknown>[], 'users')} className="px-3 py-1.5 bg-dark-primary border border-dark-accent rounded-lg text-gray-300 text-xs hover:border-yellow-500/50 flex items-center gap-1">
                        <FileSpreadsheet className="w-3 h-3" /> CSV
                      </button>
                      <button onClick={() => exportToJSON(users, 'users')} className="px-3 py-1.5 bg-dark-primary border border-dark-accent rounded-lg text-gray-300 text-xs hover:border-yellow-500/50 flex items-center gap-1">
                        <FileJson className="w-3 h-3" /> JSON
                      </button>
                    </div>
                  )}
                </div>
                
                {users.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">No users yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-dark-primary text-gray-400 text-xs uppercase">
                        <tr>
                          <th className="px-4 py-3 text-left">User</th>
                          <th className="px-4 py-3 text-left">Plan</th>
                          <th className="px-4 py-3 text-left">Scans</th>
                          <th className="px-4 py-3 text-left">Joined</th>
                          <th className="px-4 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-accent">
                        {users.map(u => (
                          <tr key={u.uid} className="hover:bg-dark-primary/50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-dark-accent flex items-center justify-center overflow-hidden relative">
                                  {u.photoURL ? <Image src={u.photoURL} alt="" fill className="rounded-full object-cover" sizes="32px" /> : <span className="text-gray-400 text-xs">{u.email?.[0]?.toUpperCase()}</span>}
                                </div>
                                <div>
                                  <p className="text-white font-medium flex items-center gap-1">{u.displayName || 'User'} {u.isAdmin && <Crown className="w-3 h-3 text-yellow-500" />}</p>
                                  <p className="text-gray-500 text-xs">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs ${u.plan === 'enterprise' ? 'bg-yellow-500/20 text-yellow-400' : u.plan === 'pro' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                {(u.plan || 'free').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-300">{u.scansUsed || 0}/{u.scansLimit === -1 ? '∞' : (u.scansLimit || 1)}</td>
                            <td className="px-4 py-3 text-gray-400">{formatDate(u.createdAt)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs ${u.subscriptionStatus === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                {u.subscriptionStatus || 'free'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Scans Tab */}
            {activeTab === 'scans' && (
              <div className="bg-dark-secondary border border-dark-accent rounded-xl overflow-hidden">
                <div className="p-4 border-b border-dark-accent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-white font-semibold">Scans ({selectedTagFilter === 'all' ? scans.length : filteredScans.length})</h3>
                    {getAllTagsFromScans().length > 0 && (
                      <select
                        value={selectedTagFilter}
                        onChange={(e) => setSelectedTagFilter(e.target.value)}
                        className="px-3 py-1.5 bg-dark-primary border border-dark-accent rounded-lg text-white text-xs focus:outline-none focus:border-yellow-500/50"
                      >
                        <option value="all">All Tags</option>
                        {getAllTagsFromScans().map(tag => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  {scans.length > 0 && (
                    <div className="flex gap-2">
                      <button onClick={() => exportToCSV(filteredScans as unknown as Record<string, unknown>[], 'scans')} className="px-3 py-1.5 bg-dark-primary border border-dark-accent rounded-lg text-gray-300 text-xs hover:border-yellow-500/50 flex items-center gap-1">
                        <FileSpreadsheet className="w-3 h-3" /> CSV
                      </button>
                      <button onClick={() => exportToJSON(filteredScans, 'scans')} className="px-3 py-1.5 bg-dark-primary border border-dark-accent rounded-lg text-gray-300 text-xs hover:border-yellow-500/50 flex items-center gap-1">
                        <FileJson className="w-3 h-3" /> JSON
                      </button>
                    </div>
                  )}
                </div>
                
                {filteredScans.length === 0 ? (
                  <div className="p-12 text-center">
                    <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">No scans found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-dark-primary text-gray-400 text-xs uppercase">
                        <tr>
                          <th className="px-4 py-3 text-left">URL</th>
                          <th className="px-4 py-3 text-left">Score</th>
                          <th className="px-4 py-3 text-left">User</th>
                          <th className="px-4 py-3 text-left">Tags</th>
                          <th className="px-4 py-3 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-accent">
                        {filteredScans.slice(0, 50).map(scan => (
                          <tr key={scan.id} className="hover:bg-dark-primary/50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 max-w-xs">
                                <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <span className="text-white font-mono text-xs truncate">{scan.url}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${scan.score >= 80 ? 'text-green-500' : scan.score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>{scan.score}</span>
                                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${scan.grade.startsWith('A') ? 'bg-green-500/20 text-green-400' : scan.grade === 'B' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{scan.grade}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs max-w-32 truncate">{scan.userEmail}</td>
                            <td className="px-4 py-3">
                              {((scan as ScanRecord & { tags?: string[] }).tags || []).length > 0 ? (
                                <div className="flex gap-1">
                                  {((scan as ScanRecord & { tags?: string[] }).tags || []).slice(0, 2).map((tag, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400/80 text-xs rounded flex items-center gap-0.5">
                                      <Tag className="w-3 h-3" />{tag}
                                    </span>
                                  ))}
                                </div>
                              ) : <span className="text-gray-600 text-xs">-</span>}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(scan.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Revenue Tab */}
            {activeTab === 'revenue' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-dark-secondary border border-dark-accent rounded-xl p-6 text-center">
                    <DollarSign className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-white">${revenueStats?.totalRevenue.toLocaleString() || '0'}</p>
                    <p className="text-gray-500 text-sm">Total Revenue</p>
                  </div>
                  <div className="bg-dark-secondary border border-green-500/30 rounded-xl p-6 text-center">
                    <TrendingUp className="w-10 h-10 text-green-500 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-green-400">${revenueStats?.thisMonthRevenue.toLocaleString() || '0'}</p>
                    <p className="text-gray-500 text-sm">This Month</p>
                  </div>
                  <div className="bg-dark-secondary border border-dark-accent rounded-xl p-6 text-center">
                    <Calendar className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-white">${revenueStats?.lastMonthRevenue.toLocaleString() || '0'}</p>
                    <p className="text-gray-500 text-sm">Last Month</p>
                  </div>
                </div>

                <div className="bg-dark-secondary border border-dark-accent rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4">Subscription Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-dark-primary rounded-xl">
                      <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-gray-400" />
                        <div>
                          <p className="text-white font-medium">Essential (Free)</p>
                          <p className="text-gray-500 text-sm">{revenueStats?.subscriptionsByPlan.essential || 0} users</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-gray-400">€0</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-dark-primary rounded-xl border border-purple-500/30">
                      <div className="flex items-center gap-3">
                        <Star className="w-6 h-6 text-purple-500" />
                        <div>
                          <p className="text-white font-medium">Pro ($39/mo)</p>
                          <p className="text-purple-400 text-sm">{revenueStats?.subscriptionsByPlan.pro || 0} users</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-purple-400">${((revenueStats?.subscriptionsByPlan.pro || 0) * 39).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-dark-primary rounded-xl border border-yellow-500/30">
                      <div className="flex items-center gap-3">
                        <Crown className="w-6 h-6 text-yellow-500" />
                        <div>
                          <p className="text-white font-medium">Enterprise (Custom)</p>
                          <p className="text-yellow-400 text-sm">{revenueStats?.subscriptionsByPlan.enterprise || 0} users</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-yellow-400">Custom</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Testimonials Tab */}
            {activeTab === 'testimonials' && (
              <div className="bg-dark-secondary border border-dark-accent rounded-xl overflow-hidden">
                <div className="p-4 border-b border-dark-accent flex items-center justify-between">
                  <h3 className="text-white font-semibold">Testimonials ({testimonials.length})</h3>
                  <button onClick={loadTestimonials} className="px-3 py-1.5 bg-dark-primary border border-dark-accent rounded-lg text-gray-300 text-xs hover:border-yellow-500/50 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                {testimonials.length === 0 ? (
                  <div className="p-12 text-center">
                    <Star className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">No testimonials yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-dark-accent">
                    {testimonials.map((t) => (
                      <div key={t.id} className="p-4 flex flex-col sm:flex-row items-start gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {t.authorPhotoURL ? (
                            <Image src={t.authorPhotoURL} alt={t.authorName} width={40} height={40} className="rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                              <span className="text-yellow-500 font-semibold">{t.authorName[0]}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-medium">{t.authorName}</span>
                              <div className="flex">
                                {[1,2,3,4,5].map(star => (
                                  <Star key={star} className={`w-3 h-3 ${star <= t.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-700'}`} />
                                ))}
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${t.approved ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {t.approved ? 'Approved' : 'Pending'}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm line-clamp-2">{t.message}</p>
                            <p className="text-gray-500 text-xs mt-1">{t.userEmail}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 sm:flex-shrink-0">
                          {!t.approved && (
                            <button
                              onClick={async () => {
                                if (!t.id) return;
                                await approveTestimonial(t.id);
                                toast.success('Approved!');
                                loadTestimonials();
                              }}
                              className="p-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (!t.id || !confirm('Delete this testimonial?')) return;
                              await deleteTestimonial(t.id);
                              toast.success('Deleted');
                              loadTestimonials();
                            }}
                            className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
