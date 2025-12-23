'use client';

import { motion } from 'framer-motion';
import { Shield, AlertTriangle, AlertOctagon, CheckCircle2, XOctagon } from 'lucide-react';

interface ThreatMeterProps {
  threats: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export default function ThreatMeter({ threats, size = 'md', animated = true }: ThreatMeterProps) {
  const totalThreats = threats.critical + threats.high + threats.medium + threats.low + threats.info;
  
  // Calculate threat level (0-100, where 0 is best)
  const threatLevel = Math.min(100, 
    threats.critical * 25 + 
    threats.high * 15 + 
    threats.medium * 8 + 
    threats.low * 3 + 
    threats.info * 1
  );

  const getThreatStatus = () => {
    if (threatLevel === 0) return { label: 'Secure', color: '#22c55e', icon: CheckCircle2 };
    if (threatLevel <= 20) return { label: 'Low Risk', color: '#84cc16', icon: Shield };
    if (threatLevel <= 40) return { label: 'Moderate', color: '#eab308', icon: AlertTriangle };
    if (threatLevel <= 70) return { label: 'High Risk', color: '#f97316', icon: AlertOctagon };
    return { label: 'Critical', color: '#ef4444', icon: XOctagon };
  };

  const status = getThreatStatus();
  const StatusIcon = status.icon;

  const dimensions = {
    sm: { width: 140, height: 90, strokeWidth: 10, fontSize: 'text-lg', labelSize: 'text-xs' },
    md: { width: 200, height: 120, strokeWidth: 14, fontSize: 'text-2xl', labelSize: 'text-sm' },
    lg: { width: 280, height: 160, strokeWidth: 18, fontSize: 'text-4xl', labelSize: 'text-base' },
  };

  const dim = dimensions[size];
  const centerX = dim.width / 2;
  const centerY = dim.height - 15;
  const radius = Math.min(centerX, centerY) - dim.strokeWidth;

  // Create segments for the gauge
  const segments = [
    { color: '#22c55e', start: 0, end: 20 },    // Green - Secure
    { color: '#84cc16', start: 20, end: 40 },   // Light green - Low
    { color: '#eab308', start: 40, end: 60 },   // Yellow - Moderate
    { color: '#f97316', start: 60, end: 80 },   // Orange - High
    { color: '#ef4444', start: 80, end: 100 },  // Red - Critical
  ];

  const angleRange = 180;
  const startAngle = -180;

  const getArcPath = (start: number, end: number) => {
    const startRad = ((startAngle + (angleRange * start / 100)) * Math.PI) / 180;
    const endRad = ((startAngle + (angleRange * end / 100)) * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArc = end - start > 50 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Needle position
  const needleAngle = startAngle + (angleRange * threatLevel / 100);
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = radius - dim.strokeWidth;
  const needleX = centerX + needleLength * Math.cos(needleRad);
  const needleY = centerY + needleLength * Math.sin(needleRad);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: dim.width, height: dim.height }}>
        <svg width={dim.width} height={dim.height} className="overflow-visible">
          {/* Background */}
          <path
            d={getArcPath(0, 100)}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={dim.strokeWidth + 4}
            strokeLinecap="round"
          />

          {/* Colored segments */}
          {segments.map((segment, idx) => (
            <motion.path
              key={idx}
              d={getArcPath(segment.start, segment.end)}
              fill="none"
              stroke={segment.color}
              strokeWidth={dim.strokeWidth}
              strokeLinecap="butt"
              initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 0.3 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            />
          ))}

          {/* Active indicator overlay */}
          {threatLevel > 0 && (
            <motion.path
              d={getArcPath(0, threatLevel)}
              fill="none"
              stroke={status.color}
              strokeWidth={dim.strokeWidth}
              strokeLinecap="round"
              initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ filter: `drop-shadow(0 0 6px ${status.color})` }}
            />
          )}

          {/* Tick marks */}
          {[0, 20, 40, 60, 80, 100].map((tick) => {
            const tickAngle = startAngle + (angleRange * tick / 100);
            const tickRad = (tickAngle * Math.PI) / 180;
            const innerRadius = radius + dim.strokeWidth / 2 + 3;
            const outerRadius = radius + dim.strokeWidth / 2 + 8;
            const x1 = centerX + innerRadius * Math.cos(tickRad);
            const y1 = centerY + innerRadius * Math.sin(tickRad);
            const x2 = centerX + outerRadius * Math.cos(tickRad);
            const y2 = centerY + outerRadius * Math.sin(tickRad);
            
            return (
              <g key={tick}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={tick % 40 === 0 ? 2 : 1}
                />
              </g>
            );
          })}

          {/* Needle */}
          <motion.g
            initial={animated ? { rotate: -180 } : { rotate: needleAngle }}
            animate={{ rotate: needleAngle }}
            transition={{ duration: 1.2, ease: "easeOut", type: "spring", stiffness: 60 }}
            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
          >
            {/* Needle shadow */}
            <line
              x1={centerX}
              y1={centerY}
              x2={centerX}
              y2={centerY - needleLength}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={4}
              strokeLinecap="round"
              transform={`translate(2, 2)`}
            />
            {/* Main needle */}
            <line
              x1={centerX}
              y1={centerY}
              x2={centerX}
              y2={centerY - needleLength}
              stroke="white"
              strokeWidth={3}
              strokeLinecap="round"
            />
            {/* Needle center */}
            <circle cx={centerX} cy={centerY} r={8} fill={status.color} />
            <circle cx={centerX} cy={centerY} r={4} fill="white" />
          </motion.g>

          {/* Labels */}
          <text x={8} y={centerY + 5} className="fill-green-500 text-xs font-medium">SAFE</text>
          <text x={dim.width - 35} y={centerY + 5} className="fill-red-500 text-xs font-medium">RISK</text>
        </svg>
      </div>

      {/* Status Label */}
      <motion.div 
        className="flex flex-col items-center mt-2"
        initial={animated ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      >
        <div 
          className={`px-4 py-1.5 rounded-full ${dim.labelSize} font-semibold flex items-center gap-2`}
          style={{ backgroundColor: `${status.color}20`, color: status.color }}
        >
          <StatusIcon className="w-4 h-4" />
          <span>{status.label}</span>
        </div>
        
        {/* Threat breakdown */}
        <div className="flex items-center gap-3 mt-3 text-xs">
          {threats.critical > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {threats.critical} Critical
            </span>
          )}
          {threats.high > 0 && (
            <span className="flex items-center gap-1 text-orange-500">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              {threats.high} High
            </span>
          )}
          {threats.medium > 0 && (
            <span className="flex items-center gap-1 text-yellow-500">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              {threats.medium} Medium
            </span>
          )}
          {threats.low > 0 && (
            <span className="flex items-center gap-1 text-green-500">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {threats.low} Low
            </span>
          )}
        </div>
        
        {totalThreats === 0 && (
          <p className="text-green-500 text-sm mt-2">No threats detected</p>
        )}
      </motion.div>
    </div>
  );
}

