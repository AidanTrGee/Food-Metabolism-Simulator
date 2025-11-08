
import { FASTING_STATE, GRAMS_TO_MMOL, KCAL_PER_G_CARB } from '../constants';
import type { ModelParameters, SimulationState, Meal } from '../types';
import { Compartment } from '../types';

export class SimulationEngine {
  public state: SimulationState;
  private params: ModelParameters;

  constructor(parameters: ModelParameters) {
    this.params = parameters;
    this.state = JSON.parse(JSON.stringify(FASTING_STATE));
  }

  getState(): SimulationState {
    return JSON.parse(JSON.stringify(this.state));
  }

  getConcentration(compartment: Compartment, nutrient: 'glucose'): number {
    const amount = this.state.nutrients[nutrient][compartment] ?? 0;
    let volume = 1;
    switch (compartment) {
        case Compartment.Blood: volume = this.params.vol_blood; break;
        case Compartment.IntestineLumen: volume = this.params.vol_intestine_lumen; break;
        case Compartment.IntestineTissue: volume = this.params.vol_intestine_tissue; break;
        case Compartment.Liver: volume = this.params.vol_liver; break;
        default: return amount; // For sinks like muscle, return amount not concentration
    }
    return amount / volume;
  }

  addMeal(meal: Meal) {
    this.state.nutrients.glucose.Stomach = (this.state.nutrients.glucose.Stomach ?? 0) + meal.carbs * GRAMS_TO_MMOL;
  }
  
  reset() {
    this.state = JSON.parse(JSON.stringify(FASTING_STATE));
  }

  step(dt: number) {
    const p = this.params;
    const s = this.state.nutrients.glucose;

    // Concentrations (mM)
    // FIX: Use Compartment enum members instead of string literals for type safety.
    const C_blood = this.getConcentration(Compartment.Blood, 'glucose');
    const C_lumen = this.getConcentration(Compartment.IntestineLumen, 'glucose');
    const C_tissue = this.getConcentration(Compartment.IntestineTissue, 'glucose');

    // --- HORMONES ---
    // Simple insulin signal based on blood glucose rise above 5.0 mM
    const insulinSignal = Math.max(0, (C_blood - 5.0) / 2.0); // Simple proportional control
    this.state.hormones.insulinSignal = insulinSignal;
    
    // Nutrient flux calculations (mmol/min)
    const dG: { [key in Compartment]?: number } = {};

    // --- 1. GASTRIC EMPTYING ---
    const stomachEnergy = (s.Stomach ?? 0) / GRAMS_TO_MMOL / KCAL_PER_G_CARB;
    const ge_flux = stomachEnergy > 0 ? p.k_GE_base / stomachEnergy * ((s.Stomach ?? 0)) * dt : 0;
    dG.Stomach = (dG.Stomach ?? 0) - ge_flux;
    dG.IntestineLumen = (dG.IntestineLumen ?? 0) + ge_flux;

    // --- 2. INTESTINAL ABSORPTION (Lumen -> Tissue) ---
    // SGLT1
    const sglt1_flux = p.Vmax_SGLT1 * (C_lumen / (p.Kt_SGLT1 + C_lumen)) * dt;
    // Apical GLUT2 (recruited at high glucose)
    const f_apGLUT2 = 1 / (1 + Math.exp(-(C_lumen - p.G50_GLUT2) / 5));
    const apGLUT2_flux = f_apGLUT2 * p.Vmax_apGLUT2_factor * Math.max(0, C_lumen - C_tissue) * dt;
    // Paracellular
    const para_flux = p.k_para_factor * Math.max(0, C_lumen - C_blood) * dt;
    const total_absorption_flux = Math.min((s.IntestineLumen ?? 0), sglt1_flux + apGLUT2_flux + para_flux);
    
    dG.IntestineLumen = (dG.IntestineLumen ?? 0) - total_absorption_flux;
    dG.IntestineTissue = (dG.IntestineTissue ?? 0) + total_absorption_flux;

    // --- 3. BASOLATERAL EXPORT (Tissue -> Blood) ---
    const export_flux = Math.min((s.IntestineTissue ?? 0), p.k_export_IntT * (s.IntestineTissue ?? 0) * dt);
    dG.IntestineTissue = (dG.IntestineTissue ?? 0) - export_flux;
    dG.Blood = (dG.Blood ?? 0) + export_flux;
    
    // --- 4. LIVER ---
    // Hepatic Glucose Output (suppressed by insulin)
    const hgo_flux = p.HGO_basal * Math.max(0, 1 - p.delta_I_HGO * insulinSignal) * dt;
    // Hepatic Uptake
    const hep_uptake_flux = p.Vmax_hep_uptake * (C_blood / (p.Km_hep_uptake + C_blood)) * dt;
    const net_liver_flux = hep_uptake_flux - hgo_flux;
    
    dG.Liver = (dG.Liver ?? 0) + net_liver_flux;
    dG.Blood = (dG.Blood ?? 0) - net_liver_flux;

    // --- 5. PERIPHERAL UPTAKE (Muscle & Adipose) ---
    const insulin_multiplier = 1 + p.gamma_I_periph * insulinSignal;
    // Muscle
    const muscle_uptake_flux = (p.Vmax_muscle_basal * insulin_multiplier) * (C_blood / (p.Km_muscle + C_blood)) * dt;
    dG.Muscle = (dG.Muscle ?? 0) + muscle_uptake_flux;
    dG.Blood = (dG.Blood ?? 0) - muscle_uptake_flux;
    // Adipose
    const adipose_uptake_flux = (p.Vmax_adipose_basal * insulin_multiplier) * (C_blood / (p.Km_adipose + C_blood)) * dt;
    dG.Adipose = (dG.Adipose ?? 0) + adipose_uptake_flux;
    dG.Blood = (dG.Blood ?? 0) - adipose_uptake_flux;

    // --- 6. RENAL EXCRETION ---
    let renal_flux = 0;
    if (C_blood > p.renal_threshold) {
        renal_flux = p.k_excrete * (C_blood - p.renal_threshold) * dt;
    }
    dG.Blood = (dG.Blood ?? 0) - renal_flux;
    this.state.cumulative.renalExcretion += renal_flux;
    
    // --- UPDATE STATE ---
    for (const key in dG) {
        const compartment = key as Compartment;
        s[compartment] = Math.max(0, (s[compartment] ?? 0) + (dG[compartment] ?? 0));
    }
    this.state.time += dt;
  }
}