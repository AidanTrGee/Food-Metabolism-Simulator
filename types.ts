
export enum Compartment {
  Stomach = 'Stomach',
  IntestineLumen = 'IntestineLumen',
  IntestineTissue = 'IntestineTissue',
  Liver = 'Liver',
  Blood = 'Blood',
  Muscle = 'Muscle',
  Adipose = 'Adipose',
}

export interface Meal {
  carbs: number; // in grams
  protein: number; // in grams
  fat: number; // in grams
  fiber: number; // in grams
}

export interface SimulationState {
  time: number; // in minutes
  nutrients: {
    glucose: { [key in Compartment]?: number }; // in mmol
  };
  hormones: {
    insulinSignal: number; // 0 to 1+
  };
  cumulative: {
    renalExcretion: number; // in mmol
  };
}

export interface ModelParameters {
  // Gastric Emptying
  k_GE_base: number; // kcal/min
  // Intestinal Absorption
  Vmax_SGLT1: number; // mmol/min
  Kt_SGLT1: number; // mM
  G50_GLUT2: number; // mM
  Vmax_apGLUT2_factor: number; // unitless factor for Vmax
  k_para_factor: number; // unitless factor for permeability
  k_export_IntT: number; // /min
  // Liver
  HGO_basal: number; // mmol/min
  Vmax_hep_uptake: number; // mmol/min
  Km_hep_uptake: number; // mM
  // Peripheral Uptake
  Vmax_muscle_basal: number; // mmol/min
  Km_muscle: number; // mM
  Vmax_adipose_basal: number; // mmol/min
  Km_adipose: number; // mM
  // Renal
  renal_threshold: number; // mM
  k_excrete: number; // mmol/min per mM excess
  // Hormonal Effects
  delta_I_HGO: number; // insulin suppression on HGO
  gamma_I_periph: number; // insulin stimulation on peripheral uptake
  // Volumes
  vol_intestine_lumen: number; // L
  vol_intestine_tissue: number; // L
  vol_blood: number; // L
  vol_liver: number; // L
}

export type ChartDataPoint = {
  time: number;
  bloodGlucose: number; // mM
  stomachGlucose: number; // grams
  liverGlucose: number; // mmol
};
