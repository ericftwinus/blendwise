export interface CalcInput {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: "Male" | "Female";
  activityFactor?: number;
}

export interface EnergyResult {
  bmr: number;
  totalMin: number;
  totalMax: number;
}

export interface ProteinResult {
  min: number;
  max: number;
  gPerKg: { min: number; max: number };
}

export interface FluidResult {
  byKcal: number;
  byWeight: { min: number; max: number };
}

// Mifflin-St Jeor Equation
// Male:   E = 10w + 6.25h - 5a + 5
// Female: E = 10w + 6.25h - 5a - 161
export function calculateEnergy(input: CalcInput): EnergyResult {
  const { weightKg, heightCm, age, sex, activityFactor = 1.2 } = input;

  const bmr =
    sex === "Male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  // Use a range: low activity (1.2) to moderate (activityFactor or 1.5)
  const totalMin = Math.round(bmr * 1.2);
  const totalMax = Math.round(bmr * Math.max(activityFactor, 1.4));

  return { bmr: Math.round(bmr), totalMin, totalMax };
}

// Protein needs based on g/kg body weight
// General range: 0.8 - 1.2 g/kg for stable adults
// Stressed/healing: 1.2 - 2.0 g/kg
export function calculateProtein(
  weightKg: number,
  gPerKgMin: number = 0.8,
  gPerKgMax: number = 1.2
): ProteinResult {
  return {
    min: Math.round(weightKg * gPerKgMin),
    max: Math.round(weightKg * gPerKgMax),
    gPerKg: { min: gPerKgMin, max: gPerKgMax },
  };
}

// Fluid needs
// Method 1: 1 mL per kcal
// Method 2: 30-40 mL/kg body weight
export function calculateFluid(
  weightKg: number,
  totalKcal: number,
  mlPerKgMin: number = 30,
  mlPerKgMax: number = 40
): FluidResult {
  return {
    byKcal: Math.round(totalKcal * 1),
    byWeight: {
      min: Math.round(weightKg * mlPerKgMin),
      max: Math.round(weightKg * mlPerKgMax),
    },
  };
}

// Calculate age from DOB string (YYYY-MM-DD)
export function ageFromDob(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
