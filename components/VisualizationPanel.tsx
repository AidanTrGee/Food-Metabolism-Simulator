
import React from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import type { SimulationState, ChartDataPoint } from '../types';
import { Compartment } from '../types';
import type { SimulationEngine } from '../services/simulationEngine';

interface VisualizationPanelProps {
  simulationState: SimulationState;
  chartData: ChartDataPoint[];
  engine: SimulationEngine;
}

const CompartmentDisplay: React.FC<{ title: string; value: number; unit: string; color: string }> = ({ title, value, unit, color }) => {
    const intensity = Math.min(255, Math.floor(value * 20));
    const bgColor = `rgba(${color}, ${intensity / 255 * 0.5})`;
    const borderColor = `rgba(${color}, 1)`;
  
    return (
        <div className="bg-gray-700 rounded-lg p-3 text-center transition-all" style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
            <div className="text-sm text-gray-300">{title}</div>
            <div className="text-xl font-bold font-mono text-white">{value.toFixed(1)}</div>
            <div className="text-xs text-gray-400">{unit}</div>
        </div>
    );
};

const VisualizationPanel: React.FC<VisualizationPanelProps> = ({ simulationState, chartData, engine }) => {
  const { nutrients } = simulationState;

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <CompartmentDisplay title="Stomach" value={(nutrients.glucose.Stomach ?? 0) / 1000 * 180.156 / 4} unit="g CHO" color="239, 68, 68" />
        {/* FIX: Use Compartment enum members instead of string literals for type safety. */}
        <CompartmentDisplay title="Intestine" value={engine.getConcentration(Compartment.IntestineLumen, 'glucose')} unit="mM" color="245, 158, 11" />
        {/* FIX: Use Compartment enum members instead of string literals for type safety. */}
        <CompartmentDisplay title="Blood" value={engine.getConcentration(Compartment.Blood, 'glucose')} unit="mM" color="59, 130, 246" />
        <CompartmentDisplay title="Liver (Net)" value={nutrients.glucose.Liver ?? 0} unit="mmol" color="139, 92, 246" />
        <CompartmentDisplay title="Muscle (Uptake)" value={nutrients.glucose.Muscle ?? 0} unit="mmol" color="16, 185, 129" />
      </div>

      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis dataKey="time" stroke="#A0AEC0" unit=" min" />
            <YAxis yAxisId="left" stroke="#A0AEC0" label={{ value: 'Blood Glucose (mM)', angle: -90, position: 'insideLeft', fill: '#A0AEC0' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#A0AEC0" label={{ value: 'Amount (g/mmol)', angle: 90, position: 'insideRight', fill: '#A0AEC0' }}/>
            <Tooltip
              contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }}
              labelStyle={{ color: '#E2E8F0' }}
            />
            <Legend wrapperStyle={{color: '#E2E8F0'}}/>
            <Line yAxisId="left" type="monotone" dataKey="bloodGlucose" name="Blood Glucose" stroke="#38BDF8" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="stomachGlucose" name="Stomach CHO" stroke="#F87171" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="liverGlucose" name="Liver Net Glucose" stroke="#A78BFA" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VisualizationPanel;