import React from 'react';

const Sparkline = ({ data = [], width = 120, height = 36, color = '#10B981', strokeWidth = 2, fill = true }) => {
  if (!data || data.length === 0) return null;
  const values = data.map((d) => d.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (data.length - 1 || 1);
  const points = data.map((d, i) => `${i * stepX},${height - ((d.v - min) / range) * height}`).join(' ');
  const areaPoints = `${points} ${width},${height} 0,${height}`;
  const gradId = `g-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill && <polygon points={areaPoints} fill={`url(#${gradId})`} />}
      <polyline points={points} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default Sparkline;
