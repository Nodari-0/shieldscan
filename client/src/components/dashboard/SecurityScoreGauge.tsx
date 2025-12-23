'use client';

import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface SecurityScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

export default function SecurityScoreGauge({ 
  score, 
  size = 'md', 
  showLabel = true,
  animated = true 
}: SecurityScoreGaugeProps) {
  const getGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const getColor = (score: number) => {
    if (score >= 80) return { primary: '#22c55e', secondary: '#16a34a', bg: 'rgba(34, 197, 94, 0.1)' };
    if (score >= 60) return { primary: '#eab308', secondary: '#ca8a04', bg: 'rgba(234, 179, 8, 0.1)' };
    if (score >= 40) return { primary: '#f97316', secondary: '#ea580c', bg: 'rgba(249, 115, 22, 0.1)' };
    return { primary: '#ef4444', secondary: '#dc2626', bg: 'rgba(239, 68, 68, 0.1)' };
  };

  const getStatus = (score: number) => {
    if (score >= 80) return { text: 'Excellent', icon: CheckCircle };
    if (score >= 60) return { text: 'Good', icon: Shield };
    if (score >= 40) return { text: 'Fair', icon: AlertTriangle };
    return { text: 'Critical', icon: XCircle };
  };

  const dimensions = {
    sm: { width: 120, height: 80, strokeWidth: 8, fontSize: 'text-2xl', labelSize: 'text-xs' },
    md: { width: 180, height: 110, strokeWidth: 10, fontSize: 'text-4xl', labelSize: 'text-sm' },
    lg: { width: 240, height: 140, strokeWidth: 12, fontSize: 'text-5xl', labelSize: 'text-base' },
  };

  const dim = dimensions[size];
  const color = getColor(score);
  const status = getStatus(score);
  const StatusIcon = status.icon;
  const grade = getGrade(score);

  // Calculate the arc path
  const centerX = dim.width / 2;
  const centerY = dim.height - 10;
  const radius = Math.min(centerX, centerY) - dim.strokeWidth;
  
  // Arc goes from -180 to 0 degrees (bottom half circle)
  const startAngle = -180;
  const endAngle = 0;
  const angleRange = endAngle - startAngle;
  const currentAngle = startAngle + (angleRange * score / 100);

  // Convert angles to radians
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const currentRad = (currentAngle * Math.PI) / 180;

  // Calculate arc points
  const startX = centerX + radius * Math.cos(startRad);
  const startY = centerY + radius * Math.sin(startRad);
  const endX = centerX + radius * Math.cos(endRad);
  const endY = centerY + radius * Math.sin(endRad);
  const currentX = centerX + radius * Math.cos(currentRad);
  const currentY = centerY + radius * Math.sin(currentRad);

  // Create arc path
  const backgroundPath = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
  const foregroundPath = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${currentX} ${currentY}`;

  // Calculate circumference for animation
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: dim.width, height: dim.height }}>
        <svg width={dim.width} height={dim.height} className="overflow-visible">
          {/* Gradient definitions */}
          <defs>
            <linearGradient id={`gauge-gradient-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color.primary} />
              <stop offset="100%" stopColor={color.secondary} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background arc */}
          <path
            d={backgroundPath}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={dim.strokeWidth}
            strokeLinecap="round"
          />

          {/* Foreground arc (animated) */}
          <motion.path
            d={backgroundPath}
            fill="none"
            stroke={`url(#gauge-gradient-${score})`}
            strokeWidth={dim.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset: dashOffset }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            filter="url(#glow)"
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const tickAngle = startAngle + (angleRange * tick / 100);
            const tickRad = (tickAngle * Math.PI) / 180;
            const innerRadius = radius - dim.strokeWidth / 2 - 4;
            const outerRadius = radius + dim.strokeWidth / 2 + 4;
            const x1 = centerX + innerRadius * Math.cos(tickRad);
            const y1 = centerY + innerRadius * Math.sin(tickRad);
            const x2 = centerX + outerRadius * Math.cos(tickRad);
            const y2 = centerY + outerRadius * Math.sin(tickRad);
            
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1}
              />
            );
          })}

          {/* Needle */}
          <motion.g
            initial={animated ? { rotate: -180 } : { rotate: currentAngle }}
            animate={{ rotate: currentAngle }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
          >
            <circle cx={centerX} cy={centerY} r={dim.strokeWidth / 2 + 2} fill={color.primary} />
            <line
              x1={centerX}
              y1={centerY}
              x2={centerX}
              y2={centerY - radius + dim.strokeWidth}
              stroke={color.primary}
              strokeWidth={3}
              strokeLinecap="round"
            />
          </motion.g>

          {/* Center dot */}
          <circle cx={centerX} cy={centerY} r={dim.strokeWidth / 3} fill="white" />
        </svg>

        {/* Score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <motion.div
            className={`${dim.fontSize} font-bold`}
            style={{ color: color.primary }}
            initial={animated ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {score}
          </motion.div>
        </div>
      </div>

      {showLabel && (
        <motion.div 
          className="flex flex-col items-center mt-2"
          initial={animated ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        >
          <div 
            className={`px-3 py-1 rounded-full ${dim.labelSize} font-semibold flex items-center gap-1.5`}
            style={{ backgroundColor: color.bg, color: color.primary }}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{status.text}</span>
            <span className="font-bold ml-1">({grade})</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

