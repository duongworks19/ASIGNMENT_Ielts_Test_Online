import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TestScoreChart = ({ data }) => {
  const isEmpty = !data || !Array.isArray(data) || data.length === 0;

  if (isEmpty) {
    return (
      <div 
        className="d-flex align-items-center justify-content-center w-100 rounded"
        style={{ height: '300px', backgroundColor: '#f8fafc', color: '#64748b' }}
      >
        Chưa có dữ liệu bài thi
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#64748b' }} 
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            domain={[0, 9]} 
            ticks={[0, 3, 6, 9]}
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)' 
            }}
            labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
            itemStyle={{ color: '#2563eb', fontWeight: '700' }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#2563eb"
            strokeWidth={3}
            activeDot={{ r: 6, fill: '#fff', stroke: '#2563eb', strokeWidth: 2 }}
            dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TestScoreChart;
