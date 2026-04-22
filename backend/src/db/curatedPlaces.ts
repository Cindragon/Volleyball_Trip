/**
 * Curated nearby-places dataset, keyed by the team's `city` field.
 *
 * Used as a fallback for `/api/places/nearby` when:
 *   - No Google Maps API key is configured, OR
 *   - The Google Places call errors / returns zero results.
 *
 * Coverage: major host cities have real named landmarks; smaller cities rely
 * on the generic arena-offset fallback at the bottom (generateGenericNearby).
 *
 * Keep each category small (~2-3 items) — the user just needs seed options,
 * not an exhaustive guide.
 */

export interface CuratedPlace {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  user_ratings_total: number;
  types: string[];
  photo_reference: null;
  opening_hours: null;
}

type CategoryKey = 'tourist_attraction' | 'restaurant' | 'lodging' | 'museum';

const t = (k: CategoryKey): string[] => {
  switch (k) {
    case 'tourist_attraction': return ['tourist_attraction', 'point_of_interest'];
    case 'restaurant':         return ['restaurant', 'food', 'point_of_interest'];
    case 'lodging':            return ['lodging', 'point_of_interest'];
    case 'museum':             return ['museum', 'tourist_attraction', 'point_of_interest'];
  }
};

const mk = (
  city: string,
  slug: string,
  name: string,
  address: string,
  lat: number,
  lng: number,
  rating: number,
  category: CategoryKey,
  reviews = 500
): CuratedPlace => ({
  place_id: `curated-${city.toLowerCase().replace(/\s+/g, '-')}-${slug}`,
  name,
  address,
  lat,
  lng,
  rating,
  user_ratings_total: reviews,
  types: t(category),
  photo_reference: null,
  opening_hours: null,
});

/**
 * Curated entries by city (case-insensitive lookup via normaliseCity()).
 * Each city aims for ~2-3 attractions, ~2 restaurants, ~2 hotels, ~2 museums.
 */
const CURATED: Record<string, CuratedPlace[]> = {
  // ── Italy ────────────────────────────────────────────────────────────────
  milan: [
    mk('milan', 'duomo',     'Duomo di Milano',           'P.za del Duomo, Milan',            45.4641,  9.1919, 4.8, 'tourist_attraction', 120000),
    mk('milan', 'galleria',  'Galleria Vittorio Emanuele II','Piazza del Duomo, Milan',        45.4659,  9.1899, 4.7, 'tourist_attraction',  60000),
    mk('milan', 'sforza',    'Sforza Castle',             'Piazza Castello, Milan',           45.4705,  9.1794, 4.6, 'tourist_attraction',  42000),
    mk('milan', 'trattoria', 'Trattoria Milanese',        'Via Santa Marta 11, Milan',        45.4621,  9.1832, 4.5, 'restaurant',           3200),
    mk('milan', 'ratana',    'Ratanà',                    'Via Gaetano de Castillia 28',      45.4839,  9.1905, 4.5, 'restaurant',           2900),
    mk('milan', 'hotel-principe','Hotel Principe di Savoia','Piazza della Repubblica 17',     45.4793,  9.1975, 4.6, 'lodging',              5100),
    mk('milan', 'hotel-rosa','Starhotels Rosa Grand',     'Piazza Fontana 3, Milan',          45.4636,  9.1923, 4.4, 'lodging',              4800),
    mk('milan', 'pinacoteca','Pinacoteca di Brera',       'Via Brera 28, Milan',              45.4719,  9.1881, 4.6, 'museum',              12000),
    mk('milan', 'novecento', 'Museo del Novecento',       'Piazza del Duomo 8, Milan',        45.4634,  9.1902, 4.4, 'museum',               8600),
  ],

  modena: [
    mk('modena','duomo',     'Modena Cathedral',          'Corso Duomo, Modena',              44.6466, 10.9252, 4.7, 'tourist_attraction', 12000),
    mk('modena','ghirlandina','Torre Ghirlandina',        'Piazza Grande, Modena',            44.6463, 10.9249, 4.6, 'tourist_attraction',  5400),
    mk('modena','piazza',    'Piazza Grande',             'Piazza Grande, Modena',            44.6460, 10.9254, 4.8, 'tourist_attraction',  9800),
    mk('modena','osteria',   'Osteria Francescana',       'Via Stella 22, Modena',            44.6458, 10.9256, 4.7, 'restaurant',           1500),
    mk('modena','hosteria',  'Hosteria Giusti',           'Vicolo Squallore 46, Modena',      44.6478, 10.9296, 4.6, 'restaurant',            700),
    mk('modena','canalgrande','Hotel Canalgrande',        'Corso Canal Grande 6, Modena',     44.6441, 10.9275, 4.4, 'lodging',              1100),
    mk('modena','estense',   'Galleria Estense',          'Largo Porta Sant\'Agostino 337',   44.6500, 10.9264, 4.7, 'museum',               3600),
    mk('modena','ferrari',   'Museo Enzo Ferrari',        'Via Paolo Ferrari 85, Modena',     44.6549, 10.9223, 4.6, 'museum',               8300),
  ],

  verona: [
    mk('verona','arena',     'Verona Arena',              'Piazza Bra, Verona',               45.4390, 10.9947, 4.8, 'tourist_attraction', 90000),
    mk('verona','juliet',    'Casa di Giulietta',         'Via Cappello 23, Verona',          45.4419, 10.9986, 4.3, 'tourist_attraction', 60000),
    mk('verona','erbe',      'Piazza delle Erbe',         'Piazza delle Erbe, Verona',        45.4434, 10.9975, 4.7, 'tourist_attraction', 30000),
    mk('verona','bottega',   'Bottega Vini',              'Via Scudo di Francia 3, Verona',   45.4421, 10.9959, 4.5, 'restaurant',           2400),
    mk('verona','12apostoli','Ristorante 12 Apostoli',    'Corticella S. Marco 3, Verona',    45.4432, 10.9961, 4.4, 'restaurant',           1200),
    mk('verona','due-torri', 'Due Torri Hotel',           'Piazza S. Anastasia 4, Verona',    45.4463, 10.9981, 4.6, 'lodging',              2200),
    mk('verona','castelvecchio','Castelvecchio Museum',   'Corso Castelvecchio 2, Verona',    45.4400, 10.9891, 4.6, 'museum',               8800),
  ],

  perugia: [
    mk('perugia','piazza',   'Piazza IV Novembre',        'Piazza IV Novembre, Perugia',      43.1122, 12.3888, 4.7, 'tourist_attraction',  9500),
    mk('perugia','rocca',    'Rocca Paolina',             'Piazza Italia, Perugia',           43.1095, 12.3890, 4.6, 'tourist_attraction',  7800),
    mk('perugia','priori',   'Palazzo dei Priori',        'Corso Vannucci 19, Perugia',       43.1122, 12.3886, 4.6, 'tourist_attraction',  4300),
    mk('perugia','civico25', 'Civico 25',                 'Via della Viola 25, Perugia',      43.1131, 12.3931, 4.6, 'restaurant',            900),
    mk('perugia','grand',    'Sina Brufani',              'Piazza Italia 12, Perugia',        43.1097, 12.3884, 4.5, 'lodging',              1400),
    mk('perugia','umbra',    'Galleria Nazionale dell\'Umbria','Corso Vannucci 19',           43.1120, 12.3886, 4.7, 'museum',               3200),
  ],

  trento: [
    mk('trento','duomo',     'Piazza Duomo',              'Piazza Duomo, Trento',             46.0669, 11.1211, 4.7, 'tourist_attraction',  8200),
    mk('trento','buonconsiglio','Castello del Buonconsiglio','Via Bernardo Clesio 5, Trento', 46.0705, 11.1248, 4.7, 'tourist_attraction',  5300),
    mk('trento','sasslong',  'Scrigno del Duomo',         'Piazza Duomo 29, Trento',          46.0670, 11.1214, 4.5, 'restaurant',            600),
    mk('trento','grandhotel','Grand Hotel Trento',        'Via Alfieri 1, Trento',            46.0717, 11.1185, 4.4, 'lodging',              1100),
    mk('trento','muse',      'MUSE — Science Museum',     'Corso del Lavoro e della Scienza 3',46.0632,11.1133, 4.6, 'museum',              10500),
  ],

  padova: [
    mk('padova','prato',     'Prato della Valle',         'Prato della Valle, Padova',        45.3988, 11.8759, 4.7, 'tourist_attraction', 18000),
    mk('padova','basilica',  'Basilica di Sant\'Antonio', 'Piazza del Santo 11, Padova',      45.4016, 11.8805, 4.8, 'tourist_attraction', 22000),
    mk('padova','scrovegni', 'Scrovegni Chapel',          'Piazza Eremitani 8, Padova',       45.4119, 11.8803, 4.8, 'tourist_attraction', 11000),
    mk('padova','pedrocchi', 'Caffè Pedrocchi',           'Via VIII Febbraio 15, Padova',     45.4070, 11.8770, 4.5, 'restaurant',           3600),
    mk('padova','mpn-hotel', 'Methis Hotel & Spa',        'Riviera Paleocapa 70, Padova',     45.4003, 11.8692, 4.5, 'lodging',              1200),
    mk('padova','eremitani', 'Musei Civici agli Eremitani','Piazza Eremitani 8, Padova',      45.4122, 11.8802, 4.5, 'museum',               2400),
  ],

  monza: [
    mk('monza','villa',      'Villa Reale di Monza',      'Viale Brianza 1, Monza',           45.5888, 9.2794, 4.6, 'tourist_attraction',  7100),
    mk('monza','park',       'Parco di Monza',            'Viale Cavriga, Monza',             45.5968, 9.2769, 4.7, 'tourist_attraction', 14500),
    mk('monza','derby',      'Derby Grill',               'Viale Regina Margherita 15',       45.5833, 9.2714, 4.5, 'restaurant',            480),
    mk('monza','delaville',  'Hotel de la Ville',         'Viale Regina Margherita 15, Monza',45.5832, 9.2711, 4.6, 'lodging',               980),
    mk('monza','duomo',      'Duomo di Monza',            'Piazza Duomo, Monza',              45.5843, 9.2755, 4.7, 'museum',                5400),
  ],

  'civitanova marche': [
    mk('civitanova','beach', 'Civitanova Beach',          'Lungomare Piermanni, Civitanova',  43.3066, 13.7391, 4.6, 'tourist_attraction',  4200),
    mk('civitanova','alta',  'Civitanova Alta',           'Civitanova Alta, Civitanova',      43.3225, 13.7277, 4.5, 'tourist_attraction',  1600),
    mk('civitanova','galileo','Galileo Ristorante',       'Viale IV Novembre 162',            43.3079, 13.7358, 4.4, 'restaurant',            620),
    mk('civitanova','palace','Palace Hotel',              'Piazza Rosselli 6, Civitanova',    43.3088, 13.7275, 4.3, 'lodging',               560),
  ],

  cuneo: [
    mk('cuneo','galimberti', 'Piazza Galimberti',         'Piazza Galimberti, Cuneo',         44.3886, 7.5470, 4.6, 'tourist_attraction',  2800),
    mk('cuneo','gesso',      'Fiume Gesso Park',          'Parco Fluviale Gesso, Cuneo',      44.3797, 7.5527, 4.6, 'tourist_attraction',  1200),
    mk('cuneo','hotel-lovera','Lovera Palace',            'Via Roma 37, Cuneo',               44.3886, 7.5458, 4.4, 'lodging',               480),
    mk('cuneo','civico',     'Museo Civico di Cuneo',     'Via S. Maria 10, Cuneo',           44.3898, 7.5484, 4.3, 'museum',                 520),
  ],

  piacenza: [
    mk('piacenza','duomo',   'Piacenza Cathedral',        'Piazza Duomo, Piacenza',           45.0518, 9.6988, 4.6, 'tourist_attraction',  3100),
    mk('piacenza','cavalli', 'Piazza Cavalli',            'Piazza Cavalli, Piacenza',         45.0522, 9.6944, 4.6, 'tourist_attraction',  4500),
    mk('piacenza','peppino', 'Peppino Ristorante',        'Via Scalabrini 49, Piacenza',      45.0504, 9.6964, 4.5, 'restaurant',            480),
    mk('piacenza','grande-albergo','Grande Albergo Roma', 'Via Cittadella 14, Piacenza',      45.0506, 9.6929, 4.3, 'lodging',               620),
    mk('piacenza','ricci',   'Galleria Ricci Oddi',       'Via S. Siro 13, Piacenza',         45.0543, 9.6892, 4.5, 'museum',                 720),
  ],

  // ── Japan ────────────────────────────────────────────────────────────────
  tokyo: [
    mk('tokyo','sensoji',    'Sensō-ji Temple',           '2 Chome-3-1 Asakusa, Taitō',       35.7148,139.7967, 4.6, 'tourist_attraction', 95000),
    mk('tokyo','shibuya',    'Shibuya Crossing',          'Shibuya, Tokyo',                   35.6595,139.7004, 4.6, 'tourist_attraction', 85000),
    mk('tokyo','skytree',    'Tokyo Skytree',             '1 Chome-1-2 Oshiage, Sumida',      35.7101,139.8107, 4.6, 'tourist_attraction', 55000),
    mk('tokyo','tsukiji',    'Tsukiji Outer Market',      '4 Chome Tsukiji, Chūō',            35.6655,139.7707, 4.5, 'tourist_attraction', 26000),
    mk('tokyo','sukiyabashi','Sukiyabashi Jiro',          '4 Chome-2-15 Ginza, Chūō',         35.6720,139.7632, 4.5, 'restaurant',           1400),
    mk('tokyo','ichiran',    'Ichiran Shibuya',           '1 Chome-22-7 Jinnan, Shibuya',     35.6617,139.6981, 4.4, 'restaurant',           9800),
    mk('tokyo','park-hyatt', 'Park Hyatt Tokyo',          '3 Chome-7-1-2 Nishi-Shinjuku',     35.6858,139.6907, 4.6, 'lodging',              6400),
    mk('tokyo','imperial',   'The Imperial Hotel',        '1 Chome-1-1 Uchisaiwaichō',        35.6719,139.7589, 4.5, 'lodging',              5200),
    mk('tokyo','national-museum','Tokyo National Museum', '13-9 Uenokōen, Taitō',             35.7188,139.7764, 4.6, 'museum',              20500),
    mk('tokyo','teamlab',    'teamLab Planets TOKYO',     '6 Chome-1-16 Toyosu, Kōtō',        35.6485,139.7928, 4.5, 'museum',              32000),
  ],

  osaka: [
    mk('osaka','castle',     'Osaka Castle',              '1-1 Ōsakajō, Chūō Ward',           34.6873,135.5262, 4.5, 'tourist_attraction', 75000),
    mk('osaka','dotonbori',  'Dōtonbori',                 'Dōtonbori, Chūō Ward',             34.6687,135.5013, 4.5, 'tourist_attraction', 42000),
    mk('osaka','umeda-sky',  'Umeda Sky Building',        '1-1-88 Ōyodonaka, Kita Ward',      34.7053,135.4908, 4.5, 'tourist_attraction', 24000),
    mk('osaka','kanidoraku', 'Kani Dōraku Honten',        '1-6-18 Dōtonbori, Chūō Ward',      34.6687,135.5010, 4.3, 'restaurant',           6200),
    mk('osaka','creo-ru',    'Creo-ru Okonomiyaki',       '1-6-4 Dōtonbori, Chūō Ward',       34.6686,135.5005, 4.3, 'restaurant',           3100),
    mk('osaka','ritz',       'The Ritz-Carlton Osaka',    '2-5-25 Umeda, Kita Ward',          34.7024,135.4962, 4.6, 'lodging',              3700),
    mk('osaka','art-museum', 'Osaka City Museum of Fine Arts','1-82 Chausuyamachō, Tennōji',  34.6499,135.5073, 4.3, 'museum',               1400),
    mk('osaka','science',    'Osaka Science Museum',      '4-2-1 Nakanoshima, Kita Ward',     34.6936,135.4914, 4.3, 'museum',               3100),
  ],

  nagoya: [
    mk('nagoya','castle',    'Nagoya Castle',             '1-1 Hommaru, Naka Ward',           35.1856,136.8997, 4.3, 'tourist_attraction', 28000),
    mk('nagoya','atsuta',    'Atsuta Jingu Shrine',       '1-1-1 Jingū, Atsuta Ward',         35.1275,136.9085, 4.5, 'tourist_attraction', 13000),
    mk('nagoya','sakae',     'Sakae Oasis 21',            '1-11-1 Higashi-Sakura, Higashi',   35.1722,136.9091, 4.3, 'tourist_attraction',  9400),
    mk('nagoya','yabaton',   'Yabaton Misokatsu',         '3-6-18 Ōsu, Naka Ward',            35.1605,136.9047, 4.3, 'restaurant',           4800),
    mk('nagoya','marriott',  'Nagoya Marriott Associa',   '1-1-4 Meieki, Nakamura Ward',      35.1710,136.8824, 4.5, 'lodging',              2800),
    mk('nagoya','toyota',    'Toyota Commemorative Museum','4-1-35 Noritakeshinmachi',        35.1845,136.8773, 4.5, 'museum',               5100),
  ],

  hiroshima: [
    mk('hiroshima','peace',  'Peace Memorial Park',       '1-2 Nakajimachō, Naka Ward',       34.3924,132.4536, 4.8, 'tourist_attraction', 42000),
    mk('hiroshima','dome',   'Atomic Bomb Dome',          '1-10 Ōtemachi, Naka Ward',         34.3955,132.4536, 4.8, 'tourist_attraction', 30000),
    mk('hiroshima','miyajima','Miyajima Itsukushima Shrine','1-1 Miyajima-chō, Hatsukaichi',  34.2959,132.3196, 4.7, 'tourist_attraction', 26000),
    mk('hiroshima','okonomi','Okonomi-mura',              '5-13 Shintenchi, Naka Ward',       34.3917,132.4604, 4.3, 'restaurant',           3600),
    mk('hiroshima','sheraton','Sheraton Grand Hiroshima', '12-1 Wakakusachō, Higashi Ward',   34.3978,132.4748, 4.5, 'lodging',              1800),
    mk('hiroshima','peace-museum','Peace Memorial Museum','1-2 Nakajimachō, Naka Ward',       34.3913,132.4517, 4.8, 'museum',              31000),
  ],

  nagano: [
    mk('nagano','zenkoji',   'Zenkō-ji Temple',           '491 Nagano-Motoyoshichō',          36.6617,138.1877, 4.6, 'tourist_attraction', 11000),
    mk('nagano','togakushi', 'Togakushi Shrine',          'Togakushi, Nagano',                36.7577,138.0688, 4.7, 'tourist_attraction',  4200),
    mk('nagano','oyakiya',   'Oyakiya Honten',            '531 Daimonchō, Nagano',            36.6603,138.1866, 4.3, 'restaurant',            580),
    mk('nagano','metropolitan','Hotel Metropolitan Nagano','1346 Minaminagano, Nagano',       36.6432,138.1885, 4.4, 'lodging',               980),
    mk('nagano','prefectural','Nagano Prefectural Shinano Art Museum','1-4-4 Hakoshimizu',    36.6654,138.1898, 4.4, 'museum',                720),
  ],

  kitahiroshima: [
    mk('kitahiroshima','park','Kita-Hiroshima Sports Park','Ōmagari, Kitahiroshima',          42.9881,141.5585, 4.4, 'tourist_attraction',   320),
    mk('kitahiroshima','kitahiro-ra','Kitahiro-Ra Hot Spring','2-18 Midorichō',               42.9846,141.5634, 4.3, 'tourist_attraction',   410),
    mk('kitahiroshima','sushi','Sushi Takara',            '3 Chome Chūōmachi',                42.9852,141.5591, 4.3, 'restaurant',            180),
    mk('kitahiroshima','route-inn','Hotel Route Inn Kita-Hiroshima','1 Chome-8 Chūōmachi',    42.9857,141.5605, 4.2, 'lodging',               620),
  ],

  mishima: [
    mk('mishima','taisha',   'Mishima Taisha Shrine',     '2-1-5 Ōmiyachō, Mishima',          35.1259,138.9190, 4.6, 'tourist_attraction',  4400),
    mk('mishima','skywalk',  'Mishima Skywalk',           '313 Sasahara Shinden',             35.1408,138.8957, 4.4, 'tourist_attraction',  7200),
    mk('mishima','genbe',    'Genbe-gawa Park',           'Ichibanchō, Mishima',              35.1222,138.9143, 4.6, 'tourist_attraction',  2100),
    mk('mishima','unagi',    'Unagi Sakuraya',            '1-22 Hirokōji-chō, Mishima',       35.1257,138.9155, 4.4, 'restaurant',            840),
    mk('mishima','grand',    'Hotel Grand Mishima',       '1-12-4 Hirokōji-chō',              35.1262,138.9151, 4.3, 'lodging',               380),
  ],

  kariya: [
    mk('kariya','highway',   'Kariya Highway Oasis',      '1-1 Higashi-Sakaimachi, Kariya',   35.0218,137.0011, 4.4, 'tourist_attraction',  9500),
    mk('kariya','mirai',     'Mirai Park',                '4 Chome Mirai-chō, Kariya',        34.9871,137.0020, 4.3, 'tourist_attraction',   680),
    mk('kariya','torishige', 'Torishige',                 '1-5 Sakuramachi, Kariya',          34.9914,137.0016, 4.3, 'restaurant',            220),
    mk('kariya','associa',   'Kariya Kokusai Hotel',      '2-1 Kariyamachi',                  34.9887,137.0014, 4.2, 'lodging',               340),
  ],

  sakai: [
    mk('sakai','kofun',      'Daisen Kofun',              '7-1 Daisenchō, Sakai Ward',        34.5648,135.4877, 4.3, 'tourist_attraction',  3600),
    mk('sakai','nintoku-park','Daisen Park',              '2 Chome Daisenchō',                34.5663,135.4908, 4.5, 'tourist_attraction',  4200),
    mk('sakai','kankidō',    'Kankidō',                   '1-1-31 Shukuinchō-nishi',          34.5723,135.4812, 4.3, 'restaurant',            410),
    mk('sakai','daiwa',      'Daiwa Roynet Sakai-Higashi','2-1-1 Sanumachinishi, Sakai',      34.5764,135.4910, 4.3, 'lodging',               720),
  ],

  // ── Poland ───────────────────────────────────────────────────────────────
  warsaw: [
    mk('warsaw','old-town',  'Old Town Market Square',    'Rynek Starego Miasta, Warsaw',     52.2497, 21.0123, 4.7, 'tourist_attraction', 45000),
    mk('warsaw','castle',    'Royal Castle',              'Plac Zamkowy 4, Warsaw',           52.2479, 21.0141, 4.7, 'tourist_attraction', 26000),
    mk('warsaw','lazienki',  'Łazienki Park',             'Agrykola 1, Warsaw',               52.2154, 21.0355, 4.8, 'tourist_attraction', 52000),
    mk('warsaw','zapiecek',  'Zapiecek Pierogarnia',      'Świętojańska 13, Warsaw',          52.2493, 21.0121, 4.4, 'restaurant',          11000),
    mk('warsaw','bristol',   'Hotel Bristol Warsaw',      'Krakowskie Przedmieście 42/44',    52.2427, 21.0145, 4.6, 'lodging',              4800),
    mk('warsaw','polin',     'POLIN Museum',              'Anielewicza 6, Warsaw',            52.2499, 20.9938, 4.7, 'museum',              22000),
    mk('warsaw','uprising',  'Warsaw Rising Museum',      'Grzybowska 79, Warsaw',            52.2326, 20.9812, 4.7, 'museum',              29000),
  ],

  gdańsk: [
    mk('gdansk','long-market','Długi Targ',               'Długi Targ, Gdańsk',               54.3489, 18.6533, 4.8, 'tourist_attraction', 32000),
    mk('gdansk','crane',     'Gdańsk Crane (Żuraw)',      'Szeroka 67/68, Gdańsk',            54.3510, 18.6585, 4.7, 'tourist_attraction',  9400),
    mk('gdansk','mary',      'St. Mary\'s Basilica',      'Podkramarska 5, Gdańsk',           54.3505, 18.6536, 4.7, 'tourist_attraction', 13000),
    mk('gdansk','gvara',     'Gvara Restaurant',          'Wartka 5, Gdańsk',                 54.3519, 18.6579, 4.6, 'restaurant',            760),
    mk('gdansk','radisson',  'Radisson Hotel Gdańsk',     'Długi Targ 19, Gdańsk',            54.3494, 18.6527, 4.5, 'lodging',              1900),
    mk('gdansk','ww2',       'Museum of the Second World War','Plac Władysława Bartoszewskiego 1',54.3543,18.6493,4.7,'museum',              23000),
  ],

  lublin: [
    mk('lublin','old-town',  'Lublin Old Town',           'Rynek, Lublin',                    51.2485, 22.5688, 4.7, 'tourist_attraction', 11000),
    mk('lublin','castle',    'Lublin Castle',             'Zamkowa 9, Lublin',                51.2509, 22.5712, 4.5, 'tourist_attraction',  7400),
    mk('lublin','mandragora','Mandragora',                'Rynek 9, Lublin',                  51.2485, 22.5686, 4.5, 'restaurant',            2800),
    mk('lublin','grand',     'Grand Hotel Lublinianka',   'Krakowskie Przedmieście 56',       51.2494, 22.5635, 4.5, 'lodging',               980),
    mk('lublin','majdanek',  'Majdanek State Museum',     'Droga Męczenników Majdanka 67',    51.2224, 22.6062, 4.7, 'museum',                6300),
  ],

  rzeszów: [
    mk('rzeszow','market',   'Rzeszów Market Square',     'Rynek, Rzeszów',                   50.0375, 22.0045, 4.6, 'tourist_attraction',  4200),
    mk('rzeszow','castle',   'Lubomirski Castle',         'Plac Śreniawitów 3, Rzeszów',      50.0383, 22.0071, 4.4, 'tourist_attraction',  1800),
    mk('rzeszow','stary-browar','Stary Browar Rzeszowski','Kościuszki 22, Rzeszów',           50.0380, 22.0042, 4.5, 'restaurant',             860),
    mk('rzeszow','bristol',  'Hotel Bristol Tradition',   'Rynek 20, Rzeszów',                50.0375, 22.0041, 4.5, 'lodging',                740),
  ],

  olsztyn: [
    mk('olsztyn','castle',   'Olsztyn Castle',            'Zamkowa 2, Olsztyn',               53.7789, 20.4681, 4.5, 'tourist_attraction',  2400),
    mk('olsztyn','old-town', 'Olsztyn Old Town',          'Stare Miasto, Olsztyn',            53.7789, 20.4727, 4.6, 'tourist_attraction',  3100),
    mk('olsztyn','staromiejska','Staromiejska Restaurant','Stare Miasto 4/6, Olsztyn',        53.7791, 20.4720, 4.4, 'restaurant',             520),
    mk('olsztyn','warminski','Hotel Warmiński',           'Kołobrzeska 1, Olsztyn',           53.7786, 20.4523, 4.4, 'lodging',                830),
  ],

  // ── Turkey ───────────────────────────────────────────────────────────────
  i̇stanbul: [
    mk('istanbul','hagia',   'Hagia Sophia',              'Sultan Ahmet, Fatih, İstanbul',    41.0086, 28.9802, 4.7, 'tourist_attraction',160000),
    mk('istanbul','blue-mosque','Blue Mosque',            'Sultan Ahmet, Fatih, İstanbul',    41.0054, 28.9768, 4.7, 'tourist_attraction',140000),
    mk('istanbul','bazaar',  'Grand Bazaar',              'Beyazıt, Fatih, İstanbul',         41.0106, 28.9680, 4.5, 'tourist_attraction',130000),
    mk('istanbul','topkapi', 'Topkapı Palace',            'Cankurtaran, Fatih, İstanbul',     41.0115, 28.9833, 4.6, 'tourist_attraction', 95000),
    mk('istanbul','galata',  'Galata Tower',              'Bereketzade, Beyoğlu',             41.0256, 28.9744, 4.5, 'tourist_attraction', 85000),
    mk('istanbul','karakoy', 'Karaköy Lokantası',         'Kemankeş Karamustafa Paşa Mh.',    41.0242, 28.9794, 4.5, 'restaurant',            7200),
    mk('istanbul','cagdas',  'Çağdaş Kebap',              'Hocapaşa Mh., Fatih',              41.0170, 28.9760, 4.4, 'restaurant',            4100),
    mk('istanbul','four-seasons','Four Seasons Sultanahmet','Tevkifhane Sk. 1, Fatih',        41.0090, 28.9790, 4.7, 'lodging',               3100),
    mk('istanbul','pera-palace','Pera Palace Hotel',      'Meşrutiyet Cd. 52, Beyoğlu',       41.0309, 28.9741, 4.6, 'lodging',               3600),
    mk('istanbul','istanbul-modern','İstanbul Modern',    'Meclis-i Mebusan Cd., Beyoğlu',    41.0260, 28.9829, 4.4, 'museum',                7800),
    mk('istanbul','archaeology','Istanbul Archaeology Museums','Cankurtaran, Fatih',          41.0116, 28.9815, 4.6, 'museum',                9400),
  ],

  ankara: [
    mk('ankara','anitkabir', 'Anıtkabir',                 'Anıttepe, Çankaya, Ankara',        39.9254, 32.8369, 4.8, 'tourist_attraction', 72000),
    mk('ankara','castle',    'Ankara Castle',             'Kale, Altındağ, Ankara',           39.9390, 32.8625, 4.6, 'tourist_attraction', 14000),
    mk('ankara','kugulu',    'Kuğulu Park',               'Kavaklıdere, Çankaya',             39.9089, 32.8614, 4.6, 'tourist_attraction',  8500),
    mk('ankara','kebapci',   'Kebapçı İskender',          'Kızılay, Çankaya',                 39.9197, 32.8541, 4.4, 'restaurant',            2800),
    mk('ankara','swissotel', 'Swissôtel Ankara',          'Yıldızevler Mh., Çankaya',         39.8894, 32.8575, 4.6, 'lodging',              1900),
    mk('ankara','anatolian', 'Museum of Anatolian Civilizations','Kale Mh., Altındağ',        39.9394, 32.8618, 4.7, 'museum',              13000),
  ],

  bursa: [
    mk('bursa','green-mosque','Green Mosque',             'Yeşil Mh., Yıldırım, Bursa',       40.1825, 29.0875, 4.7, 'tourist_attraction',  9200),
    mk('bursa','ulu-cami',   'Ulu Cami',                  'Nalbantoğlu Mh., Osmangazi',       40.1835, 29.0628, 4.7, 'tourist_attraction', 13000),
    mk('bursa','cumalikizik','Cumalıkızık Village',       'Cumalıkızık, Yıldırım',            40.1798, 29.1770, 4.6, 'tourist_attraction',  6400),
    mk('bursa','iskender',   'Kebapçı İskender (original)','Atatürk Cd. 60, Osmangazi',       40.1853, 29.0640, 4.4, 'restaurant',            5200),
    mk('bursa','swissotel',  'Swissôtel Bursa',           'Fethiye Mh., Nilüfer',             40.2232, 29.0112, 4.5, 'lodging',              1500),
  ],

  gaziantep: [
    mk('gaziantep','castle', 'Gaziantep Castle',          'Şehitler Cd., Şahinbey',           37.0650, 37.3802, 4.5, 'tourist_attraction',  8400),
    mk('gaziantep','bazaar', 'Bakırcılar Çarşısı',        'Şahinbey, Gaziantep',              37.0629, 37.3790, 4.6, 'tourist_attraction',  3200),
    mk('gaziantep','imam-cagdas','İmam Çağdaş',           'Kale Civarı, Şahinbey',            37.0645, 37.3804, 4.6, 'restaurant',            4600),
    mk('gaziantep','divan',  'Divan Gaziantep',           'İncilipınar Mh., Şehitkamil',      37.0729, 37.3813, 4.5, 'lodging',               860),
    mk('gaziantep','mosaic', 'Zeugma Mosaic Museum',      'Mithatpaşa Mh., Şehitkamil',       37.0673, 37.3801, 4.7, 'museum',                8800),
  ],

  alanya: [
    mk('alanya','castle',    'Alanya Castle',             'Kale Mh., Alanya',                 36.5375, 32.0012, 4.7, 'tourist_attraction', 16000),
    mk('alanya','cleopatra', 'Cleopatra Beach',           'Saray Mh., Alanya',                36.5428, 31.9831, 4.7, 'tourist_attraction', 22000),
    mk('alanya','red-tower', 'Red Tower (Kızıl Kule)',    'Çarşı Mh., Alanya',                36.5427, 32.0035, 4.5, 'tourist_attraction',  7200),
    mk('alanya','ottoman',   'Ottoman House Restaurant',  'Tophane Cd., Alanya',              36.5420, 32.0028, 4.6, 'restaurant',            1800),
    mk('alanya','delphin',   'Delphin Imperial',          'Konaklı, Alanya',                  36.6291, 31.8732, 4.6, 'lodging',              4100),
  ],

  hatay: [
    mk('hatay','antakya',    'Antakya Old Town',          'Ulucami Mh., Antakya',             36.2022, 36.1611, 4.6, 'tourist_attraction',  3400),
    mk('hatay','st-peter',   'Church of Saint Peter',     'Küçükdalyan Mh., Antakya',         36.2049, 36.1759, 4.6, 'tourist_attraction',  2800),
    mk('hatay','sveyka',     'Sveyka Restaurant',         'Saray Cd., Antakya',               36.2025, 36.1598, 4.5, 'restaurant',             680),
    mk('hatay','savon',      'Savon Hotel',               'Kurtuluş Cd. 192, Antakya',        36.2017, 36.1628, 4.5, 'lodging',                720),
    mk('hatay','mosaic',     'Hatay Archaeology Museum',  'Günyazı, Antakya',                 36.1992, 36.1563, 4.7, 'museum',                5200),
  ],
};

/**
 * Normalise city name for case/diacritic-insensitive lookup.
 * Preserves the curated keys (some use specific diacritics) and falls back to
 * a looser ASCII form.
 */
function normaliseCity(city: string): string[] {
  const lower = city.toLowerCase().trim();
  const ascii = lower
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')      // strip diacritics
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u');
  return [lower, ascii];
}

/**
 * Generic arena-offset fallback used when a city isn't in the curated set.
 * Produces plausible-sounding entries ringed around the arena coordinates so
 * every team still shows *something* and the map markers are useful.
 */
function generateGenericNearby(
  city: string,
  lat: number,
  lng: number
): CuratedPlace[] {
  const mkGen = (
    slug: string,
    name: string,
    suffix: string,
    dLat: number,
    dLng: number,
    rating: number,
    category: CategoryKey
  ) =>
    mk(
      `generic-${city.toLowerCase().replace(/\s+/g, '-')}`,
      slug,
      name,
      `${suffix}, ${city}`,
      lat + dLat,
      lng + dLng,
      rating,
      category,
      200
    );

  return [
    mkGen('old-town',   `${city} Old Town`,        'City centre',     0.005,  0.004, 4.5, 'tourist_attraction'),
    mkGen('main-square',`${city} Main Square`,     'Central district', -0.003, 0.006, 4.4, 'tourist_attraction'),
    mkGen('park',       `${city} City Park`,       'Park area',        0.006, -0.005, 4.5, 'tourist_attraction'),
    mkGen('bistro',     `${city} Central Bistro`,  'Downtown',         0.002,  0.003, 4.3, 'restaurant'),
    mkGen('tavern',     `Local Tavern`,            'Near arena',      -0.002, -0.002, 4.2, 'restaurant'),
    mkGen('hotel-grand',`Grand Hotel ${city}`,     'Centre',           0.004, -0.003, 4.3, 'lodging'),
    mkGen('hotel-plaza',`Plaza Inn ${city}`,       'Near station',    -0.004,  0.003, 4.1, 'lodging'),
    mkGen('museum',     `${city} City Museum`,     'Historic district',0.003, -0.004, 4.3, 'museum'),
  ];
}

/**
 * Look up curated places for a city. Falls back to arena-offset generics when
 * the city isn't in the curated set.
 */
export function getCuratedNearby(
  city: string | undefined,
  arenaLat: number,
  arenaLng: number
): CuratedPlace[] {
  if (!city) return generateGenericNearby('Nearby', arenaLat, arenaLng);

  const keys = normaliseCity(city);
  for (const key of keys) {
    if (CURATED[key]) return CURATED[key];
  }
  // Try each curated key against the normalised forms (handles diacritics)
  for (const [k, v] of Object.entries(CURATED)) {
    const nks = normaliseCity(k);
    if (keys.some(kk => nks.includes(kk))) return v;
  }
  return generateGenericNearby(city, arenaLat, arenaLng);
}

/**
 * Filter a curated result set by Google-style type.
 */
export function filterByType(
  places: CuratedPlace[],
  type: string | undefined
): CuratedPlace[] {
  if (!type) return places;
  return places.filter(p => p.types.includes(type));
}
