import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Users, TrendingUp, Calendar, RefreshCw, Activity } from "lucide-react";
import { Appcontext } from "../context/Appcontext";

const EMOTION_COLORS = {
  Interested: "#10B981",
  confused: "#14B8A6",
  bored: "#EF4444",
};

const EmotionDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [recentEmotions, setRecentEmotions] = useState([]);
  const [timeRange, setTimeRange] = useState(7);

  const { user, setShowLogin } = useContext(Appcontext);
  const navigate = useNavigate();

  const API_BASE = "https://emotion-detection2.onrender.com/api/emotions";

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) fetchUserData();
  }, [selectedUserId, timeRange]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/users`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
        if (data.users.length > 0) setSelectedUserId(data.users[0].userId);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchUserData = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const statsRes = await fetch(
        `${API_BASE}/stats?userId=${selectedUserId}`
      );
      const statsData = await statsRes.json();
      setStats(statsData);

      const timelineRes = await fetch(
        `${API_BASE}/timeline?userId=${selectedUserId}&days=${timeRange}`
      );
      const timelineData = await timelineRes.json();
      setTimeline(timelineData.data || []);

      const historyRes = await fetch(
        `${API_BASE}/history?userId=${selectedUserId}&limit=10`
      );
      const historyData = await historyRes.json();
      setRecentEmotions(historyData.data || []);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPieData = () =>
    stats?.emotionDistribution?.map((item) => ({
      name: item.emotion,
      value: parseInt(item.count),
      percentage: item.percentage,
    })) || [];

  const getBarData = () =>
    stats?.emotionDistribution?.map((item) => ({
      emotion: item.emotion,
      count: parseInt(item.count),
      avgConfidence: parseFloat(item.avgConfidence),
    })) || [];

  const formatRecentEmotions = () =>
    recentEmotions.map((item) => ({
      emotion: item.result?.current_emotion || "N/A",
      confidence: item.result?.confidence?.toFixed(1) || 0,
      time: new Date(item.createdAt).toLocaleString(),
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Emotion Analytics Dashboard
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Real-time emotion detection analytics
          </p>
        </div>

        {/* User Selector */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Users className="text-blue-400 flex-shrink-0" size={24} />
            <div className="flex-1 w-full">
              <label className="text-sm text-slate-400 block mb-2">
                Select User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-slate-900 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-slate-700 focus:border-blue-500 outline-none transition-colors text-sm sm:text-base"
              >
                <option value="">-- Select a user --</option>
                {users.map((user) => (
                  <option key={user.userId} value={user.userId}>
                    {user.email} ({user.totalAnalyses} analyses)
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchUserData}
              disabled={!selectedUserId || loading}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-slate-400">Loading data...</p>
          </div>
        )}

        {/* Main Content */}
        {!loading && selectedUserId && stats && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <StatCard
                title="Total Analyses"
                value={stats.totalAnalyses}
                icon={<Activity size={36} />}
                gradient="from-blue-600 to-blue-700"
              />
              <StatCard
                title="Latest Emotion"
                value={stats.mostRecentEmotion || "N/A"}
                icon={<TrendingUp size={36} />}
                gradient="from-purple-600 to-purple-700"
              />
              <StatCard
                title="Last Analysis"
                value={
                  stats.lastAnalysisDate
                    ? new Date(stats.lastAnalysisDate).toLocaleDateString()
                    : "N/A"
                }
                icon={<Calendar size={36} />}
                gradient="from-green-600 to-green-700"
              />
            </div>

            {/* Time Range Selector */}
            <div className="mb-6 flex flex-wrap gap-2">
              {[7, 14, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setTimeRange(days)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base transition-colors ${
                    timeRange === days
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  Last {days} days
                </button>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ChartCard title="Emotion Distribution">
                <ChartWrapper>
                  {getPieData().length > 0 ? (
                    <PieChartComponent data={getPieData()} />
                  ) : (
                    <NoData />
                  )}
                </ChartWrapper>
              </ChartCard>

              <ChartCard title="Emotion Counts">
                <ChartWrapper>
                  {getBarData().length > 0 ? (
                    <BarChartComponent data={getBarData()} />
                  ) : (
                    <NoData />
                  )}
                </ChartWrapper>
              </ChartCard>
            </div>

            <ChartCard title="Emotion Trends Over Time" className="mb-8">
              <ChartWrapper>
                {timeline.length > 0 ? (
                  <LineChartComponent data={timeline} />
                ) : (
                  <NoData />
                )}
              </ChartWrapper>
            </ChartCard>

            {/* Recent Table */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6 overflow-x-auto">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">
                Recent Detections
              </h3>
              <table className="w-full min-w-[600px] text-sm sm:text-base">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">
                      Emotion
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">
                      Confidence
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formatRecentEmotions().map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-3 px-4 capitalize">
                        <span
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: `${
                              EMOTION_COLORS[item.emotion]
                            }20`,
                            color: EMOTION_COLORS[item.emotion],
                          }}
                        >
                          {item.emotion}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {item.confidence}%
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs sm:text-sm">
                        {item.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ==================== COMPONENTS ====================

const StatCard = ({ title, value, icon, gradient }) => (
  <div
    className={`bg-gradient-to-br ${gradient} rounded-xl p-4 sm:p-6 shadow-lg`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-blue-100 text-sm mb-1">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold">{value}</p>
      </div>
      <div className="text-blue-200 opacity-60">{icon}</div>
    </div>
  </div>
);

const ChartCard = ({ title, children, className = "" }) => (
  <div
    className={`bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6 ${className}`}
  >
    <h3 className="text-lg sm:text-xl font-semibold mb-4">{title}</h3>
    {children}
  </div>
);

const ChartWrapper = ({ children }) => (
  <div className="w-full h-[300px] sm:h-[350px] lg:h-[400px]">{children}</div>
);

const PieChartComponent = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius="80%"
        label={({ name, percentage }) => `${name}: ${percentage}%`}
      >
        {data.map((entry, i) => (
          <Cell key={i} fill={EMOTION_COLORS[entry.name] || "#6B7280"} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
);

const BarChartComponent = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="emotion" stroke="#9CA3AF" />
      <YAxis stroke="#9CA3AF" />
      <Tooltip contentStyle={{ backgroundColor: "#1F2937" }} />
      <Bar dataKey="count" fill="#3B82F6" />
    </BarChart>
  </ResponsiveContainer>
);

const LineChartComponent = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="date" stroke="#9CA3AF" />
      <YAxis stroke="#9CA3AF" />
      <Tooltip contentStyle={{ backgroundColor: "#1F2937" }} />
      <Legend />
      {Object.keys(EMOTION_COLORS).map((emotion) => (
        <Line
          key={emotion}
          type="monotone"
          dataKey={emotion}
          stroke={EMOTION_COLORS[emotion]}
          strokeWidth={2}
          dot={false}
        />
      ))}
    </LineChart>
  </ResponsiveContainer>
);

const NoData = () => (
  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
    No data available
  </div>
);

export default EmotionDashboard;
