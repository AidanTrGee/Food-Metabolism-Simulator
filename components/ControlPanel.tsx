
import React, { useState } from 'react';
import type { Meal, ModelParameters, SimulationState } from '../types';
import { ChevronDown, ChevronUp, Play, Pause, RotateCcw, Settings } from 'lucide-react';

interface ControlPanelProps {
  meal: Meal;
  setMeal: React.Dispatch<React.SetStateAction<Meal>>;
  parameters: ModelParameters;
  setParameters: React.Dispatch<React.SetStateAction<ModelParameters>>;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  isRunning: boolean;
  simulationState: SimulationState;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  meal,
  setMeal,
  parameters,
  setParameters,
  onStart,
  onPause,
  onReset,
  isRunning,
  simulationState,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleMealChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMeal({ ...meal, [e.target.name]: +e.target.value });
  };
  
  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParameters({ ...parameters, [e.target.name]: +e.target.value });
  };

  const renderParamInput = (key: keyof ModelParameters, label: string, step: number) => (
     <div key={key} className="flex justify-between items-center text-sm">
        <label htmlFor={key} className="text-gray-400">{label}</label>
        <input
            type="number"
            id={key}
            name={key}
            value={parameters[key]}
            onChange={handleParamChange}
            step={step}
            className="w-24 bg-gray-900 border border-gray-600 rounded p-1 text-right focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
    </div>
  );

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Meal Input */}
      <div className="space-y-4 p-4 bg-gray-700/50 rounded-lg">
        <h3 className="font-bold text-lg text-cyan-400">Meal Composition</h3>
        <div className="flex justify-between items-center">
            <label htmlFor="carbs">Carbohydrates (g)</label>
            <input type="number" id="carbs" name="carbs" value={meal.carbs} onChange={handleMealChange} className="w-24 bg-gray-900 border border-gray-600 rounded p-1 text-right focus:outline-none focus:ring-2 focus:ring-cyan-500" />
        </div>
         {/* Protein, Fat, Fiber inputs can be added here if model is extended */}
      </div>

      {/* Simulation Controls */}
      <div className="flex space-x-2">
        {!isRunning ? (
            <button onClick={onStart} className="flex-1 bg-cyan-600 hover:bg-cyan-500 rounded-md p-2 flex items-center justify-center space-x-2 transition-colors">
                <Play size={18} /><span>Start</span>
            </button>
        ) : (
            <button onClick={onPause} className="flex-1 bg-amber-600 hover:bg-amber-500 rounded-md p-2 flex items-center justify-center space-x-2 transition-colors">
                <Pause size={18} /><span>Pause</span>
            </button>
        )}
        <button onClick={onReset} className="flex-1 bg-gray-600 hover:bg-gray-500 rounded-md p-2 flex items-center justify-center space-x-2 transition-colors">
            <RotateCcw size={18} /><span>Reset</span>
        </button>
      </div>

      {/* Info Panel */}
      <div className="p-4 bg-gray-700/50 rounded-lg space-y-2 flex-grow">
          <h3 className="font-bold text-lg text-cyan-400">Live Metrics</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-400">Time:</span> <span className="font-mono text-right">{simulationState.time.toFixed(0)} min</span>
              <span className="text-gray-400">Insulin Signal:</span> <span className="font-mono text-right">{simulationState.hormones.insulinSignal.toFixed(2)}</span>
              <span className="text-gray-400">Renal Loss:</span> <span className="font-mono text-right">{simulationState.cumulative.renalExcretion.toFixed(2)} mmol</span>
          </div>
      </div>


      {/* Advanced Settings */}
      <div className="p-4 bg-gray-700/50 rounded-lg">
         <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex justify-between items-center font-bold text-lg text-cyan-400">
             <div className="flex items-center space-x-2">
                <Settings size={20}/>
                <span>Advanced Parameters</span>
             </div>
            {showAdvanced ? <ChevronUp /> : <ChevronDown />}
         </button>
         {showAdvanced && (
            <div className="mt-4 space-y-2">
                {renderParamInput('k_GE_base', 'Gastric Emptying (kcal/min)', 0.1)}
                {renderParamInput('Vmax_SGLT1', 'SGLT1 Vmax (mmol/min)', 0.1)}
                {renderParamInput('HGO_basal', 'Basal HGO (mmol/min)', 0.1)}
                {renderParamInput('gamma_I_periph', 'Insulin Sensitivity', 0.1)}
                {renderParamInput('renal_threshold', 'Renal Threshold (mM)', 0.5)}
            </div>
         )}
      </div>
    </div>
  );
};
export default ControlPanel;
