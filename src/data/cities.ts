export interface CityInfo {
  name: string;
  region: string;
  lat: number;
  lng: number;
}

export const UKRAINE_CITIES: CityInfo[] = [
  { name: "Київ", region: "Київська область", lat: 50.4501, lng: 30.5234 },
  { name: "Львів", region: "Львівська область", lat: 49.8397, lng: 24.0297 },
  { name: "Харків", region: "Харківська область", lat: 49.9935, lng: 36.2304 },
  { name: "Одеса", region: "Одеська область", lat: 46.4825, lng: 30.7233 },
  { name: "Дніпро", region: "Дніпропетровська область", lat: 48.4647, lng: 35.0462 },
  { name: "Запоріжжя", region: "Запорізька область", lat: 47.8388, lng: 35.1396 },
  { name: "Вінниця", region: "Вінницька область", lat: 49.2331, lng: 28.4682 },
  { name: "Івано-Франківськ", region: "Івано-Франківська область", lat: 48.9226, lng: 24.7111 },
  { name: "Тернопіль", region: "Тернопільська область", lat: 49.5535, lng: 25.5948 },
  { name: "Чернівці", region: "Чернівецька область", lat: 48.2921, lng: 25.9358 },
  { name: "Ужгород", region: "Закарпатська область", lat: 48.6208, lng: 22.2879 },
  { name: "Рівне", region: "Рівненська область", lat: 50.6199, lng: 26.2516 },
  { name: "Луцьк", region: "Волинська область", lat: 50.7472, lng: 25.3254 },
  { name: "Черкаси", region: "Черкаська область", lat: 49.4444, lng: 32.0598 },
  { name: "Полтава", region: "Полтавська область", lat: 49.5883, lng: 34.5514 },
  { name: "Суми", region: "Сумська область", lat: 50.9077, lng: 34.7981 },
  { name: "Хмельницький", region: "Хмельницька область", lat: 49.4229, lng: 26.9871 },
  { name: "Миколаїв", region: "Миколаївська область", lat: 46.975, lng: 31.9946 },
  { name: "Херсон", region: "Херсонська область", lat: 46.6354, lng: 32.6169 },
  { name: "Буковель", region: "Івано-Франківська область", lat: 48.366, lng: 24.4096 },
  { name: "Яремче", region: "Івано-Франківська область", lat: 48.4524, lng: 24.5547 },
  { name: "Трускавець", region: "Львівська область", lat: 49.2792, lng: 23.5072 },
];

export const getCityByName = (name: string): CityInfo | undefined =>
  UKRAINE_CITIES.find((c) => c.name === name);
