import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const SkillRadarChart = ({ data }) => {
  const isEmpty = !data || !Array.isArray(data) || data.length === 0;

  if (isEmpty) {
    return (
      <div 
        className="d-flex align-items-center justify-content-center w-100 rounded"
        style={{ height: '300px', backgroundColor: '#f8fafc', color: '#64748b' }}
      >
        Chưa có dữ liệu kỹ năng
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis 
            dataKey="skill" 
            tick={{ fill: '#0f172a', fontSize: 13, fontWeight: '700' }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 9]} 
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickCount={4}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)' 
            }}
            itemStyle={{ color: '#2563eb', fontWeight: '700' }}
          />
          <Radar 
            name="Band Score" 
            dataKey="score" 
            stroke="#2563eb" 
            fill="#3b82f6" 
            fillOpacity={0.4} 
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillRadarChart;
