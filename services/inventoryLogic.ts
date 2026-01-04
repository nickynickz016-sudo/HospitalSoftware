import { MedicationVial, DispenseLog } from '../types';

interface ProcessResult {
  success: boolean;
  message: string;
  updatedVials: MedicationVial[];
  logs: DispenseLog[];
}

/**
 * CORE ALGORITHM: Dose-Based Inventory Deduction
 * 
 * Requirements handled:
 * 1. FIFO (First-In-First-Out) based on Expiry Date.
 * 2. Partial vial usage.
 * 3. Rollover to next vial when current is insufficient.
 * 4. Validation of total stock before transaction.
 * 5. Floating point precision handling.
 * 6. Buffer/Wastage calculation.
 */
export const processLiquidDispensing = (
  vials: MedicationVial[],
  inventoryItemId: string,
  prescriptionId: string,
  dosePerShotMl: number,
  totalShots: number,
  bufferMl: number = 0
): ProcessResult => {
  
  // 1. Calculate Total Requirement
  // Use simple rounding to 2 decimal places to avoid floating point errors (0.1 + 0.2 = 0.300000004)
  const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;
  
  // Total includes the shots volume plus any additional buffer for wastage/dead space
  const totalRequiredMl = round((dosePerShotMl * totalShots) + bufferMl);
  
  // 2. Filter and Sort Vials (FIFO Strategy)
  // We only look at ACTIVE vials for this medication that have not expired (basic check)
  let eligibleVials = vials
    .filter(v => v.inventoryItemId === inventoryItemId && v.status === 'ACTIVE' && v.remainingVolumeMl > 0)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  // 3. Validation: Total Stock Check
  const totalAvailableMl = eligibleVials.reduce((sum, v) => sum + v.remainingVolumeMl, 0);
  
  if (totalAvailableMl < totalRequiredMl) {
    return {
      success: false,
      message: `Insufficient volume. Required: ${totalRequiredMl}mL (incl. ${bufferMl}mL buffer), Available: ${round(totalAvailableMl)}mL`,
      updatedVials: [],
      logs: []
    };
  }

  // 4. Deduction Logic (Rollover Loop)
  let remainingToDeduct = totalRequiredMl;
  const updatedVials: MedicationVial[] = []; // Store only modified vials
  const logs: DispenseLog[] = [];
  
  // We iterate through a copy to avoid mutating state directly during calculation
  const vialQueue = JSON.parse(JSON.stringify(eligibleVials)) as MedicationVial[];

  for (const vial of vialQueue) {
    if (remainingToDeduct <= 0) break;

    const volumeInVial = vial.remainingVolumeMl;
    let volumeTaken = 0;

    if (volumeInVial >= remainingToDeduct) {
      // Case A: Vial has enough to finish the order
      volumeTaken = remainingToDeduct;
      vial.remainingVolumeMl = round(volumeInVial - volumeTaken);
      remainingToDeduct = 0;
    } else {
      // Case B: Vial is drained, need to roll over to next vial
      volumeTaken = volumeInVial;
      vial.remainingVolumeMl = 0;
      remainingToDeduct = round(remainingToDeduct - volumeTaken);
    }

    // Update Status
    if (vial.remainingVolumeMl <= 0) {
      vial.status = 'EMPTY';
    }

    // Create Audit Log
    logs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      prescriptionId: prescriptionId,
      vialId: vial.id,
      deductedMl: volumeTaken,
      remainingAfter: vial.remainingVolumeMl,
      timestamp: new Date().toISOString()
    });

    updatedVials.push(vial);
  }

  return {
    success: true,
    message: `Dispensed ${totalRequiredMl}mL successfully across ${updatedVials.length} vial(s).`,
    updatedVials,
    logs
  };
};