
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SimulationEngine } from './services/simulationEngine';
import { DEFAULT_PARAMS, FASTING_STATE } from './constants';
// FIX: Import Compartment enum for use in getConcentration.
import { Compartment, type ModelParameters, type SimulationState, type Meal, type ChartDataPoint } from './types';
import ControlPanel from './components/ControlPanel';
import VisualizationPanel from './components/VisualizationPanel';

const App: React.FC = () => {
  const [simulationState, setSimulationState] = useState<SimulationState>(FASTING_STATE);
  const [parameters, setParameters] = useState<ModelParameters>(DEFAULT_PARAMS);
  const [meal, setMeal] = useState<Meal>({ carbs: 75, protein: 0, fat: 0, fiber: 0 });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  
  const engineRef = useRef<SimulationEngine>(new SimulationEngine(parameters));
  const simulationFrameRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);

  useEffect(() => {
    engineRef.current = new SimulationEngine(parameters);
  }, [parameters]);

  const runSimulation = useCallback((timestamp: number) => {
    if (lastUpdateTimeRef.current === 0) {
      lastUpdateTimeRef.current = timestamp;
    }

    const elapsed = timestamp - lastUpdateTimeRef.current;
    if (elapsed > 50) { // Update roughly every 50ms, simulating 1 minute per update
      engineRef.current.step(1); // Step 1 minute at a time
      const newState = engineRef.current.getState();
      setSimulationState(newState);

      if (newState.time % 5 === 0) { // Add data to chart every 5 simulated minutes
        setChartData(prevData => [
          ...prevData,
          {
            time: newState.time,
            // FIX: Use Compartment enum members instead of string literals for type safety.
            bloodGlucose: engineRef.current.getConcentration(Compartment.Blood, 'glucose'),
            stomachGlucose: (engineRef.current.state.nutrients.glucose.Stomach ?? 0) / 1000 * 180.156 / 4,
            liverGlucose: engineRef.current.state.nutrients.glucose.Liver ?? 0,
          }
        ]);
      }
      lastUpdateTimeRef.current = timestamp;
    }

    if (engineRef.current.getState().time < 300) { // Stop simulation after 300 minutes
       simulationFrameRef.current = requestAnimationFrame(runSimulation);
    } else {
        setIsRunning(false);
    }
  }, []);

  const handleStart = () => {
    engineRef.current.reset();
    engineRef.current.addMeal(meal);
    setSimulationState(engineRef.current.getState());
    setChartData([]);
    setIsRunning(true);
    lastUpdateTimeRef.current = 0;
    simulationFrameRef.current = requestAnimationFrame(runSimulation);
  };

  const handlePause = () => {
    setIsRunning(false);
    if (simulationFrameRef.current) {
      cancelAnimationFrame(simulationFrameRef.current);
    }
  };
  
  const handleReset = () => {
    handlePause();
    engineRef.current.reset();
    setSimulationState(FASTING_STATE);
    setChartData([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col p-4 font-sans">
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold text-cyan-400">Food Metabolism Simulator</h1>
        <p className="text-gray-400 mt-2">Visualize post-meal metabolic dynamics in the human body.</p>
      </header>
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-gray-800 rounded-lg shadow-xl p-6 overflow-y-auto">
          <ControlPanel
            meal={meal}
            setMeal={setMeal}
            parameters={parameters}
            setParameters={setParameters}
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
            isRunning={isRunning}
            simulationState={simulationState}
          />
        </div>
        <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-xl p-6 flex flex-col min-h-[70vh]">
          <VisualizationPanel
            simulationState={simulationState}
            chartData={chartData}
            engine={engineRef.current}
          />
        </div>
      </main>
    </div>
  );
};

export default App;