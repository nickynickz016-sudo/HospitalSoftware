import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { InventoryItem } from '../types';

interface StockChartProps {
  data: InventoryItem[];
}

const StockChart: React.FC<StockChartProps> = ({ data }) => {
  // Aggregate data by category for a cleaner chart
  const categoryData = React.useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(item => {
      const current = map.get(item.category) || 0;
      map.set(item.category, current + item.quantity);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [data]);

  const COLORS = ['#0ea5e9', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="h-[250px] sm:h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={categoryData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#9ca3af" 
            tick={{ fill: '#9ca3af', fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
            interval={0} // Force show all labels on larger screens if needed, or rely on auto
            tickFormatter={(val) => val.length > 10 ? `${val.slice(0, 10)}...` : val} // Truncate on X-Axis
          />
          <YAxis 
            stroke="#9ca3af" 
            tick={{ fill: '#9ca3af', fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            cursor={{ fill: '#1f2937' }}
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }}
            itemStyle={{ color: '#f3f4f6' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;