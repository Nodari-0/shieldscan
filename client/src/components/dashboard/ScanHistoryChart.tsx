'use client';

import { useMemo, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import type { ScanRecord } from '@/firebase/firestore';
import { TrendingUp, TrendingDown, Minus, BarChart3, LineChart } from 'lucide-react';
import { useState } from 'react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ScanHistoryChartProps {
  scans: ScanRecord[];
  title?: string;
  height?: number;
}

// Color function based on score value (like Chart.js scriptable bar example)
function getScoreColor(score: number, opacity: number = 1): string {
  if (score >= 80) return `rgba(34, 197, 94, ${opacity})`; // green
  if (score >= 60) return `rgba(234, 179, 8, ${opacity})`; // yellow
  if (score >= 40) return `rgba(249, 115, 22, ${opacity})`; // orange
  return `rgba(239, 68, 68, ${opacity})`; // red
}

export default function ScanHistoryChart({ 
  scans, 
  title = 'Security Score Over Time', 
  height = 300 
}: ScanHistoryChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const chartRef = useRef<ChartJS<'bar'> | ChartJS<'line'> | null>(null);

  const chartData = useMemo(() => {
    // Group scans by date
    const grouped = scans.reduce((acc, scan) => {
      const date = scan.createdAt instanceof Date 
        ? scan.createdAt 
        : (scan.createdAt as { toDate?: () => Date })?.toDate?.() || new Date();
      
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          score: scan.score,
          passed: scan.passed,
          warnings: scan.warnings,
          failed: scan.failed,
          count: 1,
        };
      } else {
        acc[dateKey].score = (acc[dateKey].score * acc[dateKey].count + scan.score) / (acc[dateKey].count + 1);
        acc[dateKey].passed += scan.passed;
        acc[dateKey].warnings += scan.warnings;
        acc[dateKey].failed += scan.failed;
        acc[dateKey].count += 1;
      }
      
      return acc;
    }, {} as Record<string, { date: string; score: number; passed: number; warnings: number; failed: number; count: number }>);

    return Object.values(grouped)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14) // Last 14 data points
      .map(item => ({
        ...item,
        displayDate: format(new Date(item.date), 'MMM dd'),
        score: Math.round(item.score),
      }));
  }, [scans]);

  // Bar chart data with scriptable colors (Chart.js pattern)
  const barData: ChartData<'bar'> = useMemo(() => ({
    labels: chartData.map(d => d.displayDate),
    datasets: [
      {
        label: 'Security Score',
        data: chartData.map(d => d.score),
        backgroundColor: chartData.map(d => getScoreColor(d.score, 0.8)),
        borderColor: chartData.map(d => getScoreColor(d.score, 1)),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }), [chartData]);

  // Line chart data with gradient
  const lineData: ChartData<'line'> = useMemo(() => ({
    labels: chartData.map(d => d.displayDate),
    datasets: [
      {
        label: 'Security Score',
        data: chartData.map(d => d.score),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartData.map(d => getScoreColor(d.score, 1)),
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
      },
    ],
  }), [chartData]);

  // Chart options with delayed animations
  const barOptions: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
      delay: (context) => {
        // Stagger animation for each bar
        let delay = 0;
        if (context.type === 'data' && context.mode === 'default') {
          delay = context.dataIndex * 100 + context.datasetIndex * 50;
        }
        return delay;
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(99, 102, 241, 0.5)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const score = context.parsed.y;
            const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'F';
            return `Score: ${score}/100 (Grade ${grade})`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
          stepSize: 20,
        },
      },
    },
  }), []);

  const lineOptions: ChartOptions<'line'> = useMemo(() => ({
    ...barOptions,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart',
    },
    elements: {
      line: {
        tension: 0.4,
      },
    },
  }), [barOptions]);

  // Stats calculations
  const stats = useMemo(() => {
    if (chartData.length === 0) return { avg: 0, trend: 'stable', change: 0 };
    
    const avg = Math.round(chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length);
    
    if (chartData.length < 2) return { avg, trend: 'stable', change: 0 };
    
    const recent = chartData.slice(-3).reduce((sum, d) => sum + d.score, 0) / Math.min(3, chartData.length);
    const older = chartData.slice(0, Math.max(1, chartData.length - 3)).reduce((sum, d) => sum + d.score, 0) / Math.max(1, chartData.length - 3);
    const change = Math.round(recent - older);
    
    return {
      avg,
      trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
      change: Math.abs(change),
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="bg-dark-secondary rounded-xl p-6 border border-dark-accent">
        <h3 className="text-white font-semibold mb-4">{title}</h3>
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
          <p>No scan history available</p>
          <p className="text-sm text-gray-500 mt-1">Start scanning to see trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-secondary rounded-xl p-6 border border-dark-accent">
      {/* Header with chart type toggle */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded-lg transition-colors ${
              chartType === 'bar' 
                ? 'bg-yellow-500/20 text-yellow-500' 
                : 'text-gray-400 hover:text-white hover:bg-dark-primary'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-2 rounded-lg transition-colors ${
              chartType === 'line' 
                ? 'bg-yellow-500/20 text-yellow-500' 
                : 'text-gray-400 hover:text-white hover:bg-dark-primary'
            }`}
          >
            <LineChart className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: height }}>
        {chartType === 'bar' ? (
          <Bar ref={chartRef as React.RefObject<ChartJS<'bar'>>} data={barData} options={barOptions} />
        ) : (
          <Line ref={chartRef as React.RefObject<ChartJS<'line'>>} data={lineData} options={lineOptions} />
        )}
      </div>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-dark-primary rounded-lg p-4 border border-dark-accent">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Avg Score</p>
          <div className="flex items-center gap-2">
            <p className={`text-2xl font-bold ${
              stats.avg >= 80 ? 'text-green-500' : 
              stats.avg >= 60 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {stats.avg}
            </p>
            <span className="text-gray-500 text-sm">/100</span>
          </div>
        </div>
        
        <div className="bg-dark-primary rounded-lg p-4 border border-dark-accent">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Scans</p>
          <p className="text-2xl font-bold text-white">{scans.length}</p>
        </div>
        
        <div className="bg-dark-primary rounded-lg p-4 border border-dark-accent">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Trend</p>
          <div className="flex items-center gap-2">
            {stats.trend === 'improving' ? (
              <>
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-green-500 font-semibold">+{stats.change}%</span>
              </>
            ) : stats.trend === 'declining' ? (
              <>
                <TrendingDown className="w-5 h-5 text-red-500" />
                <span className="text-red-500 font-semibold">-{stats.change}%</span>
              </>
            ) : (
              <>
                <Minus className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400 font-semibold">Stable</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span>80-100</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span>60-79</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-orange-500"></div>
          <span>40-59</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span>0-39</span>
        </div>
      </div>
    </div>
  );
}
