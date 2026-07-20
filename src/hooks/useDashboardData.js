import { useState, useEffect } from 'react';
import axios from 'axios';

// Dùng tạm url localhost cho json-server. Trong project thực tế (T002) sẽ cấu hình qua axios instance.
const API_URL = 'http://localhost:9999';

export const useDashboardData = (userId) => {
  const [data, setData] = useState({
    stats: {
      completedLessons: 0,
      completedTests: 0,
      averageBandScore: 'N/A',
      studyHours: 0
    },
    lineChartData: [],
    radarChartData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // EARS[Event]: WHEN the Student navigates to the dashboard, THE system SHALL fetch their personalized metrics.
        const [attemptsRes, lessonsRes] = await Promise.all([
          axios.get(`${API_URL}/testAttempts?userId=${userId}`),
          axios.get(`${API_URL}/lessonProgress?userId=${userId}`)
        ]);

        const attempts = attemptsRes.data || [];
        const lessons = lessonsRes.data || [];

        // 1. Tính toán Stat Cards
        const completedLessons = lessons.filter(l => l.status === 'completed' || l.completed === true).length;
        
        // Lọc ra những attempt thực sự đã hoàn thành (có điểm hoặc có trạng thái hoàn thành)
        const completedAttempts = attempts.filter(a => a.status === 'completed' || a.submittedAt || a.score !== undefined);
        
        const completedTests = completedAttempts.length;
        
        let avgBand = 'N/A';
        let totalHours = 0;
        
        if (completedAttempts.length > 0) {
          const totalScore = completedAttempts.reduce((acc, curr) => acc + (curr.overallBandScore || curr.score || 0), 0);
          avgBand = Number((totalScore / completedAttempts.length).toFixed(1));
          
          const totalTimeSeconds = completedAttempts.reduce((acc, curr) => acc + (curr.timeSpent || 0), 0);
          totalHours = Number((totalTimeSeconds / 3600).toFixed(1));
        }

        // 2. Tính toán Line Chart Data (Trend)
        const sortedAttempts = [...completedAttempts].sort((a, b) => {
          const dateA = new Date(a.submittedAt || a.createdAt || a.startTime || 0);
          const dateB = new Date(b.submittedAt || b.createdAt || b.startTime || 0);
          return dateA - dateB;
        });
        
        const lineChartData = sortedAttempts.map(a => {
          const dateStr = a.submittedAt || a.createdAt || a.startTime;
          return {
            date: dateStr ? new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) : 'N/A',
            score: a.overallBandScore || a.score || 0
          };
        });

        // 3. Tính toán Radar Chart Data (Skill Balance)
        const skills = ['Listening', 'Reading', 'Writing', 'Speaking'];
        const radarChartData = skills.map(skillName => {
          const skillAttempts = completedAttempts.filter(a => a.skill === skillName);
          let avgScore = 0; // Kỹ năng trống tự fallback về 0
          if (skillAttempts.length > 0) {
            const sum = skillAttempts.reduce((acc, curr) => acc + (curr.overallBandScore || curr.score || 0), 0);
            avgScore = Number((sum / skillAttempts.length).toFixed(1));
          }
          return {
            skill: skillName,
            score: avgScore
          };
        });

        setData({
          stats: {
            completedLessons,
            completedTests,
            averageBandScore: avgBand,
            studyHours: totalHours
          },
          lineChartData,
          radarChartData
        });

      } catch (err) {
        // EARS[Unwanted]: If the data fetch fails, THE system SHALL display an error message.
        setError('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { data, loading, error };
};
