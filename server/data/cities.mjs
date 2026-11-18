// Coordinates for drawing routes on the India map, plus spelling aliases seen in
// bus inventory ("Bangalore" vs "Bengaluru"). Names not listed here simply aren't
// drawn; the top route's endpoints also come with lat/lon from the data API.

export const COORDS = {
  Agra: [27.18, 78.01], Ahmedabad: [23.02, 72.57], Ajmer: [26.45, 74.64], Amritsar: [31.63, 74.87], Aurangabad: [19.88, 75.34],
  Belagavi: [15.85, 74.5], Bengaluru: [12.97, 77.59], Bhopal: [23.26, 77.41], Bhubaneswar: [20.3, 85.82], Chandigarh: [30.73, 76.78],
  Chennai: [13.08, 80.27], Chikmagalur: [13.32, 75.77], Coimbatore: [11.02, 76.96], Davangere: [14.46, 75.92], Dehradun: [30.32, 78.03],
  Delhi: [28.61, 77.21], Dharwad: [15.46, 75.01], Durgapur: [23.52, 87.31], Ernakulam: [9.98, 76.28], Goa: [15.4, 73.8],
  Gokarna: [14.55, 74.32], Guntur: [16.31, 80.44], Guwahati: [26.14, 91.74], Gwalior: [26.22, 78.18], Hampi: [15.33, 76.46],
  Hubballi: [15.36, 75.12], Hyderabad: [17.39, 78.49], Indore: [22.72, 75.86], Jaipur: [26.91, 75.79], Jodhpur: [26.24, 73.02],
  Kakinada: [16.99, 82.25], Kanpur: [26.45, 80.33], Kochi: [9.93, 76.27], Kolhapur: [16.7, 74.24], Kolkata: [22.57, 88.36],
  Kozhikode: [11.26, 75.78], Kurnool: [15.83, 78.04], Lucknow: [26.85, 80.95], Madurai: [9.93, 78.12], Mangaluru: [12.91, 74.86],
  Manali: [32.24, 77.19], Mumbai: [19.08, 72.88], Mysuru: [12.3, 76.64], Nagpur: [21.15, 79.09], Nashik: [20.0, 73.79],
  Nellore: [14.44, 79.99], Ooty: [11.41, 76.7], Patna: [25.59, 85.14], Puducherry: [11.93, 79.83], Pune: [18.52, 73.86],
  Raipur: [21.25, 81.63], Rajahmundry: [17.0, 81.8], Salem: [11.66, 78.15], Shivamogga: [13.93, 75.57], Siliguri: [26.73, 88.4],
  Surat: [21.17, 72.83], Thiruvananthapuram: [8.52, 76.94], Thrissur: [10.53, 76.21], Tiruchirappalli: [10.79, 78.7],
  Tirupati: [13.63, 79.42], Udaipur: [24.59, 73.71], Udupi: [13.34, 74.75], Vadodara: [22.31, 73.18], Varanasi: [25.32, 82.97],
  Vijayawada: [16.51, 80.65], Visakhapatnam: [17.69, 83.22], Warangal: [17.97, 79.59],
};

const ALIASES = {
  Bangalore: 'Bengaluru', Bombay: 'Mumbai', Madras: 'Chennai', Calcutta: 'Kolkata', Mysore: 'Mysuru', Mangalore: 'Mangaluru',
  Cochin: 'Kochi', Pondicherry: 'Puducherry', Trivandrum: 'Thiruvananthapuram', Calicut: 'Kozhikode', Hubli: 'Hubballi',
  Belgaum: 'Belagavi', Shimoga: 'Shivamogga', Trichy: 'Tiruchirappalli', Vizag: 'Visakhapatnam', 'New Delhi': 'Delhi',
  Gurgaon: 'Delhi', Gurugram: 'Delhi', Noida: 'Delhi', Secunderabad: 'Hyderabad', Panaji: 'Goa', Madgaon: 'Goa', Margao: 'Goa',
  Katapady: 'Udupi', Manipal: 'Udupi', Chikkamagaluru: 'Chikmagalur',
};

/**
 * Canonical city for a bus-inventory name, or null. "Katapady (Udupi)" tries
 * "Katapady", then "Udupi"; "Bangalore" becomes "Bengaluru".
 */
export function canonicalCity(name) {
  if (!name) return null;
  const outer = String(name).replace(/\s*\(.*\)\s*$/, '').trim();
  const inner = /\(([^)]+)\)\s*$/.exec(String(name))?.[1]?.trim();
  for (const n of [outer, inner]) {
    if (!n) continue;
    const key = Object.keys(COORDS).find((c) => c.toLowerCase() === n.toLowerCase());
    if (key) return key;
    const alias = Object.keys(ALIASES).find((a) => a.toLowerCase() === n.toLowerCase());
    if (alias) return ALIASES[alias];
  }
  return null;
}
