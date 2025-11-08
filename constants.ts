
import type { ModelParameters, SimulationState } from './types';
import { Compartment } from './types';

// Based on a 90kg reference male
export const DEFAULT_PARAMS: ModelParameters = {
  // Gastric Emptying: ~2.3 kcal/min baseline
  k_GE_base: 2.3,

  // Intestinal Absorption
  Vmax_SGLT1: 5.5, // mmol/min, calibrated to handle a 75g glucose load
  Kt_SGLT1: 5, // mM
  G50_GLUT2: 40, // mM
  Vmax_apGLUT2_factor: 0.05, // Vmax = factor * (C_lumen - C_tissue)
  k_para_factor: 0.005, // permeability factor for paracellular route
  k_export_IntT: 1.5, // /min, rapid export from tissue to blood

  // Liver (HGO ~1 mmol/min for 90kg person)
  HGO_basal: 1.0, // mmol/min
  Vmax_hep_uptake: 2.0, // mmol/min
  Km_hep_uptake: 15, // mM

  // Peripheral Uptake (Basal uptake balances HGO)
  Vmax_muscle_basal: 0.4, // mmol/min
  Km_muscle: 5, // mM
  Vmax_adipose_basal: 0.1, // mmol/min
  Km_adipose: 5, // mM

  // Renal
  renal_threshold: 10, // mM (180 mg/dL)
  k_excrete: 0.1, // mmol/min for each mM above threshold

  // Hormonal Effects
  delta_I_HGO: 0.8, // 80% suppression at full insulin signal
  gamma_I_periph: 4.0, // 4x increase in uptake at full insulin signal

  // Volumes
  vol_intestine_lumen: 0.5, // L
  vol_intestine_tissue: 0.2, // L
  vol_blood: 6.8, // L
  vol_liver: 1.5, // L (intracellular water)
};

const fastingBloodGlucose_mmol = 5.0 * DEFAULT_PARAMS.vol_blood; // Target 5.0 mM

export const FASTING_STATE: SimulationState = {
  time: 0,
  nutrients: {
    glucose: {
      [Compartment.Stomach]: 0,
      [Compartment.IntestineLumen]: 0,
      [Compartment.IntestineTissue]: 0,
      [Compartment.Blood]: fastingBloodGlucose_mmol,
      // Liver glucose represents net balance, starts at 0 (HGO is an output flux)
      [Compartment.Liver]: 0, 
      [Compartment.Muscle]: 0, // Sink, tracks cumulative uptake
      [Compartment.Adipose]: 0, // Sink, tracks cumulative uptake
    },
  },
  hormones: {
    insulinSignal: 0,
  },
  cumulative: {
    renalExcretion: 0,
  },
};

export const GLUCOSE_MW = 180.156; // g/mol
export const GRAMS_TO_MMOL = 1000 / GLUCOSE_MW;
export const KCAL_PER_G_CARB = 4;
