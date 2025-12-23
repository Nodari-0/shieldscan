'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, Bell, BellOff, Check, ChevronDown,
  ChevronRight, Clock, ExternalLink, Eye, Globe, RefreshCw,
  Shield, TrendingDown, TrendingUp, X, Zap, Radio, Server
} from 'lucide-react';
import {
  getThreatEvents, getMonitoringTargets, acknowledgeEvent, resolveEvent,
  getUnacknowledgedCount, getCriticalEventsCount, startRealtimeSimulation,
  getSecurityTrends, getEmergingThreats,
  type ThreatEvent, type MonitoringTarget, type EmergingThreat
} from '@/lib/realtime';

// ==========================================
// MAIN THREAT MONITOR DASHBOARD
// ==========================================

export default function ThreatMonitor() {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [targets, setTargets] = useState<MonitoringTarget[]>([]);
  const [threats, setThreats] = useState<EmergingThreat[]>([]);
  const [activeTab, setActiveTab] = useState<'events' | 'targets' | 'threats'>('events');
  const [isLive, setIsLive] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load data
  const loadData = useCallback(() => {
    setEvents(getThreatEvents(50));
    setTargets(getMonitoringTargets());
    setThreats(getEmergingThreats());
    setUnreadCount(getUnacknowledgedCount());
  }, []);

  useEffect(() => {
    loadData();
    startRealtimeSimulation();

    // Poll for updates
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleAcknowledge = (eventId: string) => {
    acknowledgeEvent(eventId);
    loadData();
  };

  const handleResolve = (eventId: string) => {
    resolveEvent(eventId);
    loadData();
  };

  const criticalCount = getCriticalEventsCount();

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-red-500/5 to-orange-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Activity className="w-5 h-5 text-red-400" />
              </div>
              {isLive && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                Threat Monitor
                {isLive && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded uppercase font-medium">
                    Live
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-500">Real-time security monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Critical count */}
            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-medium text-red-400">{criticalCount} critical</span>
              </div>
            )}

            {/* Unread count */}
            {unreadCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <Bell className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs font-medium text-yellow-400">{unreadCount}</span>
              </div>
            )}

            {/* Live toggle */}
            <button
              onClick={() => setIsLive(!isLive)}
              className={`p-2 rounded-lg transition-colors ${
                isLive ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'
              }`}
            >
              {isLive ? <Radio className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>

            {/* Refresh */}
            <button
              onClick={loadData}
              className="p-2 bg-gray-800 text-gray-400 rounded-lg hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 p-1 bg-black/30 rounded-lg">
          {[
            { id: 'events', label: 'Events', icon: Bell },
            { id: 'targets', label: 'Monitored', icon: Server },
            { id: 'threats', label: 'Intel', icon: Shield },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {activeTab === 'events' && (
          <EventsList 
            events={events} 
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
          />
        )}
        {activeTab === 'targets' && (
          <TargetsList targets={targets} />
        )}
        {activeTab === 'threats' && (
          <ThreatsList threats={threats} />
        )}
      </div>
    </div>
  );
}

// ==========================================
// EVENTS LIST
// ==========================================

function EventsList({ 
  events, 
  onAcknowledge,
  onResolve 
}: { 
  events: ThreatEvent[];
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (events.length === 0) {
    return (
      <div className="p-8 text-center">
        <Shield className="w-10 h-10 text-green-500/50 mx-auto mb-3" />
        <p className="text-gray-500">No security events</p>
        <p className="text-xs text-gray-600 mt-1">All systems operating normally</p>
      </div>
    );
  }

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500' };
      case 'high':
        return { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-500' };
      case 'medium':
        return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-500' };
      case 'low':
        return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-500' };
      default:
        return { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', dot: 'bg-gray-500' };
    }
  };

  return (
    <div className="divide-y divide-gray-800">
      {events.map((event) => {
        const config = getSeverityConfig(event.severity);
        const isExpanded = expandedId === event.id;
        const timeAgo = getTimeAgo(event.timestamp);

        return (
          <div
            key={event.id}
            className={`${event.acknowledged ? 'opacity-60' : ''} ${event.resolvedAt ? 'bg-green-500/5' : ''}`}
          >
            <div
              className="p-3 flex items-start gap-3 hover:bg-gray-800/30 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : event.id)}
            >
              {/* Severity indicator */}
              <div className={`w-2 h-2 rounded-full mt-1.5 ${config.dot} ${!event.acknowledged ? 'animate-pulse' : ''}`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">{event.title}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-medium ${config.bg} ${config.text}`}>
                    {event.severity}
                  </span>
                  {event.resolvedAt && (
                    <Check className="w-3 h-3 text-green-400" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  <span>{event.target}</span>
                  <span>•</span>
                  <span>{timeAgo}</span>
                </div>
              </div>

              {/* Expand indicator */}
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </div>

            {/* Expanded content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 pl-8 space-y-2">
                    <p className="text-xs text-gray-400">{event.description}</p>
                    <div className="text-[10px] text-gray-600">
                      Source: {event.source} • {new Date(event.timestamp).toLocaleString()}
                    </div>
                    {!event.resolvedAt && (
                      <div className="flex gap-2 pt-2">
                        {!event.acknowledged && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onAcknowledge(event.id); }}
                            className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-xs hover:text-white"
                          >
                            <Eye className="w-3 h-3 inline mr-1" />
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); onResolve(event.id); }}
                          className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs hover:bg-green-500/20"
                        >
                          <Check className="w-3 h-3 inline mr-1" />
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// TARGETS LIST
// ==========================================

function TargetsList({ targets }: { targets: MonitoringTarget[] }) {
  if (targets.length === 0) {
    return (
      <div className="p-8 text-center">
        <Globe className="w-10 h-10 text-gray-700 mx-auto mb-3" />
        <p className="text-gray-500">No monitored targets</p>
        <p className="text-xs text-gray-600 mt-1">Add domains to start monitoring</p>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'healthy':
        return { bg: 'bg-green-500', text: 'text-green-400', label: 'Healthy' };
      case 'degraded':
        return { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'Degraded' };
      case 'critical':
        return { bg: 'bg-red-500', text: 'text-red-400', label: 'Critical' };
      default:
        return { bg: 'bg-gray-500', text: 'text-gray-400', label: 'Unknown' };
    }
  };

  return (
    <div className="divide-y divide-gray-800">
      {targets.map((target) => {
        const config = getStatusConfig(target.status);
        return (
          <div key={target.id} className="p-3 flex items-center gap-3 hover:bg-gray-800/30">
            <div className={`w-2 h-2 rounded-full ${config.bg}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white truncate">{target.name || target.url}</span>
                <span className={`text-[10px] ${config.text}`}>{config.label}</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                <span>{target.url}</span>
                <span>•</span>
                <span>{target.uptime.toFixed(1)}% uptime</span>
                {target.lastScore && (
                  <>
                    <span>•</span>
                    <span>Score: {target.lastScore}</span>
                  </>
                )}
              </div>
            </div>
            {target.enabled ? (
              <Zap className="w-4 h-4 text-green-400" />
            ) : (
              <BellOff className="w-4 h-4 text-gray-600" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// THREATS LIST
// ==========================================

function ThreatsList({ threats }: { threats: EmergingThreat[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (threats.length === 0) {
    return (
      <div className="p-8 text-center">
        <Shield className="w-10 h-10 text-gray-700 mx-auto mb-3" />
        <p className="text-gray-500">No emerging threats</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-800">
      {threats.map((threat) => {
        const isExpanded = expandedId === threat.id;
        return (
          <div key={threat.id}>
            <div
              className="p-3 flex items-start gap-3 hover:bg-gray-800/30 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : threat.id)}
            >
              <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                threat.severity === 'critical' ? 'text-red-400' : 'text-orange-400'
              }`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{threat.name}</span>
                  {threat.cve && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                      {threat.cve}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{threat.description}</p>
              </div>
              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 pl-10 space-y-2">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase">Affected</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {threat.affectedTechnologies.map((tech) => (
                          <span key={tech} className="px-1.5 py-0.5 bg-gray-800 text-xs text-gray-400 rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase">Mitigations</span>
                      <ul className="mt-1 space-y-0.5">
                        {threat.mitigations.map((m, i) => (
                          <li key={i} className="text-xs text-gray-400 flex items-start gap-1">
                            <Check className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// COMPACT ALERT INDICATOR
// ==========================================

export function ThreatAlertBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(getCriticalEventsCount());
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <div className="relative">
      <Bell className="w-5 h-5 text-gray-400" />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
        {count > 9 ? '9+' : count}
      </span>
    </div>
  );
}

// ==========================================
// HELPER
// ==========================================

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

