export type Category = {
  units: string[];
  base: string;
  conversions?: Record<string, number>;
  custom?: boolean;
};

export const categories: Record<string, Category> = {
  Length: {
    units: ['Meter', 'Kilometer', 'Centimeter', 'Millimeter', 'Mile', 'Yard', 'Foot', 'Inch'],
    base: 'Meter',
    conversions: {
      Meter: 1,
      Kilometer: 1000,
      Centimeter: 0.01,
      Millimeter: 0.001,
      Mile: 1609.344,
      Yard: 0.9144,
      Foot: 0.3048,
      Inch: 0.0254,
    },
  },

  Weight: {
    units: ['Kilogram', 'Gram', 'Milligram', 'Pound', 'Ounce', 'Ton', 'Stone'],
    base: 'Kilogram',
    conversions: {
      Kilogram: 1,
      Gram: 0.001,
      Milligram: 0.000001,
      Pound: 0.453592,
      Ounce: 0.0283495,
      Ton: 1000,
      Stone: 6.35029,
    },
  },

  Temperature: {
    units: ['Celsius', 'Fahrenheit', 'Kelvin'],
    base: 'Celsius',
    custom: true,
  },

  Volume: {
    units: ['Liter', 'Milliliter', 'Gallon (US)', 'Quart', 'Pint', 'Cup', 'Fluid Ounce', 'Cubic Meter'],
    base: 'Liter',
    conversions: {
      Liter: 1,
      Milliliter: 0.001,
      'Gallon (US)': 3.78541,
      Quart: 0.946353,
      Pint: 0.473176,
      Cup: 0.236588,
      'Fluid Ounce': 0.0295735,
      'Cubic Meter': 1000,
    },
  },

  Speed: {
    units: ['m/s', 'km/h', 'mph', 'Knot', 'ft/s'],
    base: 'm/s',
    conversions: {
      'm/s': 1,
      'km/h': 0.277778,
      mph: 0.44704,
      Knot: 0.514444,
      'ft/s': 0.3048,
    },
  },

  Time: {
    units: ['Second', 'Minute', 'Hour', 'Day', 'Week', 'Month', 'Year'],
    base: 'Second',
    conversions: {
      Second: 1,
      Minute: 60,
      Hour: 3600,
      Day: 86400,
      Week: 604800,
      Month: 2629746,
      Year: 31556952,
    },
  },

  Area: {
    units: ['Square Meter', 'Square Kilometer', 'Square Mile', 'Square Foot', 'Hectare', 'Acre'],
    base: 'Square Meter',
    conversions: {
      'Square Meter': 1,
      'Square Kilometer': 1_000_000,
      'Square Mile': 2_589_988.11,
      'Square Foot': 0.092903,
      Hectare: 10_000,
      Acre: 4046.86,
    },
  },

  Data: {
    units: ['Byte', 'Kilobyte', 'Megabyte', 'Gigabyte', 'Terabyte', 'Petabyte'],
    base: 'Byte',
    conversions: {
      Byte: 1,
      Kilobyte: 1024,
      Megabyte: 1024 ** 2,
      Gigabyte: 1024 ** 3,
      Terabyte: 1024 ** 4,
      Petabyte: 1024 ** 5,
    },
  },
};

export function getCategories() {
  return Object.keys(categories);
}

export function getUnits(category: string) {
  return categories[category]?.units ?? [];
}