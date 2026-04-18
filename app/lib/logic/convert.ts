import { categories } from "@/types/unitconvert";

export function convert(
  category: string,
  value: string | number,
  from: string,
  to: string
): number | "" {
  if (value === "" || value == null) return "";

  const num = Number(value);
  if (isNaN(num)) return "";

  const cat = categories[category];
  if (!cat) return "";

  // Temperature (special case)
  if (cat.custom) {
    return convertTemperature(num, from, to);
  }

  const fromFactor = cat.conversions?.[from];
  const toFactor = cat.conversions?.[to];

  if (!fromFactor || !toFactor) return "";

  const baseValue = num * fromFactor;
  return baseValue / toFactor;
}

function convertTemperature(value: number, from: string, to: string): number {
  let celsius = value;

  if (from === "Fahrenheit") celsius = (value - 32) * (5 / 9);
  if (from === "Kelvin") celsius = value - 273.15;

  if (to === "Celsius") return celsius;
  if (to === "Fahrenheit") return celsius * (9 / 5) + 32;
  if (to === "Kelvin") return celsius + 273.15;

  return value;
}

export function formatResult(value: number | ""): string {
  if (value === "") return "";

  const num = Number(value);
  if (isNaN(num)) return "";

  if (Math.abs(num) > 1e12 || (Math.abs(num) < 1e-4 && num !== 0)) {
    return num.toExponential(6);
  }

  return parseFloat(num.toPrecision(10)).toString();
}