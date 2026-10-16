export type City = { key: string; en: string; ur: string; lat: number; lon: number };

// Main cities of Pakistan (centre points are enough for prayer times).
export const CITIES: City[] = [
  { key: "islamabad", en: "Islamabad", ur: "اسلام آباد", lat: 33.6844, lon: 73.0479 },
  { key: "karachi", en: "Karachi", ur: "کراچی", lat: 24.8607, lon: 67.0011 },
  { key: "lahore", en: "Lahore", ur: "لاہور", lat: 31.5204, lon: 74.3587 },
  { key: "rawalpindi", en: "Rawalpindi", ur: "راولپنڈی", lat: 33.5651, lon: 73.0169 },
  { key: "faisalabad", en: "Faisalabad", ur: "فیصل آباد", lat: 31.4504, lon: 73.135 },
  { key: "multan", en: "Multan", ur: "ملتان", lat: 30.1575, lon: 71.5249 },
  { key: "peshawar", en: "Peshawar", ur: "پشاور", lat: 34.0151, lon: 71.5249 },
  { key: "quetta", en: "Quetta", ur: "کوئٹہ", lat: 30.1798, lon: 66.975 },
  { key: "hyderabad", en: "Hyderabad", ur: "حیدرآباد", lat: 25.396, lon: 68.3578 },
  { key: "sialkot", en: "Sialkot", ur: "سیالکوٹ", lat: 32.4945, lon: 74.5229 },
  { key: "jhelum", en: "Jhelum", ur: "جہلم", lat: 32.9425, lon: 73.7257 },
  { key: "gujranwala", en: "Gujranwala", ur: "گوجرانوالہ", lat: 32.1877, lon: 74.1945 },
  { key: "sargodha", en: "Sargodha", ur: "سرگودھا", lat: 32.0836, lon: 72.6711 },
  { key: "bahawalpur", en: "Bahawalpur", ur: "بہاولپور", lat: 29.3544, lon: 71.6911 },
  { key: "sukkur", en: "Sukkur", ur: "سکھر", lat: 27.7052, lon: 68.8574 },
  { key: "abbottabad", en: "Abbottabad", ur: "ایبٹ آباد", lat: 34.1688, lon: 73.2215 },
  { key: "mardan", en: "Mardan", ur: "مردان", lat: 34.1986, lon: 72.0404 },
  { key: "gilgit", en: "Gilgit", ur: "گلگت", lat: 35.9208, lon: 74.308 },
  { key: "muzaffarabad", en: "Muzaffarabad", ur: "مظفرآباد", lat: 34.37, lon: 73.4711 },
  { key: "sahiwal", en: "Sahiwal", ur: "ساہیوال", lat: 30.6682, lon: 73.1114 },
  { key: "larkana", en: "Larkana", ur: "لاڑکانہ", lat: 27.557, lon: 68.2028 },
  { key: "dg-khan", en: "Dera Ghazi Khan", ur: "ڈیرہ غازی خان", lat: 30.0561, lon: 70.6403 },
];

export function getCity(key: string): City | undefined {
  return CITIES.find((c) => c.key === key);
}
