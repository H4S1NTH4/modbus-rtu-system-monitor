import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import '../styles/MetricsDisplay.css';

const MetricsDisplay = ({ telemetry, executionTime }) => {
  if (!telemetry || Object.keys(telemetry).length === 0) {
    return (
      <div className="metrics-display">
        <p className="no-data">No metrics available yet</p>
      </div>
    );
  }

  const { cpu = 0, ram = 0, disk = 0 } = telemetry;

  // Prepare data for pie chart
  const metrics = [
    { name: 'CPU Usage', value: parseFloat(cpu.toFixed(2)) },
    { name: 'RAM Usage', value: parseFloat(ram.toFixed(2)) },
    { name: 'Disk Usage', value: parseFloat(disk.toFixed(2)) },
  ];

  // Colors for metrics
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

  // Prepare data for individual metric cards
  const getMetricColor = (value) => {
    if (value >= 80) return '#d32f2f'; // Red
    if (value >= 60) return '#f57c00'; // Orange
    return '#388e3c'; // Green
  };

  const MetricCard = ({ label, value, unit }) => (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value-container">
        <div
          className="metric-value"
          style={{ color: getMetricColor(value) }}
        >
          {value.toFixed(2)}{unit}
        </div>
        <div className="metric-bar">
          <div
            className="metric-fill"
            style={{
              width: `${Math.min(value, 100)}%`,
              backgroundColor: getMetricColor(value),
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="metrics-display">
      <h3>System Metrics</h3>

      {executionTime && (
        <div className="execution-time">
          Recorded at: {new Date(executionTime).toLocaleString()}
        </div>
      )}

      <div className="metrics-cards">
        <MetricCard label="CPU Usage" value={cpu} unit="%" />
        <MetricCard label="RAM Usage" value={ram} unit="%" />
        <MetricCard label="Disk Usage" value={disk} unit="%" />
      </div>

      <div className="charts-container">
        <div className="chart-wrapper">
          <h4>Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrapper">
          <h4>Metrics Overview</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} label={{ value: 'Usage (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MetricsDisplay;
