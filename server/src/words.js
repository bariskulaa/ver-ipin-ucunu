// Türkçe kelime havuzu, konu kategorilerine ayrılmış halde tutulur.
// Amaç sadece kelime çeşitliliği değil: tahtayı oluştururken aynı kategoriden
// birden fazla kelimeyi bir arada seçen bir kümeleme algoritması kullanılır
// (bkz. pickBoardWords), böylece bir oyunda birbirine yakın/karıştırılabilir
// kelimeler (ör. birkaç ülke adı, birkaç hayvan) aynı tahtada bulunur ve
// ipucu vermek/tahmin etmek daha zor hale gelir.

export const WORD_CATEGORIES = {
  hayvanlar: [
    "Aslan", "Kaplan", "Fil", "Zürafa", "Maymun", "Kedi", "Köpek", "Kurt",
    "Tilki", "Ayı", "Tavşan", "Kartal", "Baykuş", "Papağan", "Penguen",
    "Yılan", "Timsah", "Kaplumbağa", "Balina", "Yunus", "Köpekbalığı",
    "Ahtapot", "Karınca", "Arı", "Kelebek", "Örümcek", "Fare", "Sincap",
    "Geyik", "Zebra", "Deve", "At", "İnek", "Koyun", "Keçi", "Domuz",
    "Tavuk", "Ördek", "Kaz", "Yengeç", "Flamingo", "Akrep", "Yarasa",
    "Panda", "Koala", "Kanguru", "Devekuşu",
  ],

  fantastikVarliklar: [
    "Ejderha", "Anka Kuşu", "Tek Boynuzlu At", "Vampir", "Kurt Adam",
    "Zombi", "Cadı", "Cin", "Peri", "Dev", "Cüce",
  ],

  evEsyalari: [
    "Masa", "Sandalye", "Kapı", "Pencere", "Anahtar", "Ayna", "Halı",
    "Yatak", "Yastık", "Lamba", "Saat", "Telefon", "Bilgisayar",
    "Televizyon", "Radyo", "Kamera", "Gözlük", "Şemsiye", "Çanta",
    "Cüzdan", "Kalem", "Defter", "Kitap", "Gazete", "Mektup", "Pul",
    "Makas", "İğne", "Düğme", "Ayakkabı", "Çizme", "Çorap", "Eldiven",
    "Şapka", "Kemer", "Kravat", "Gömlek", "Elbise", "Bavul", "Sepet",
    "Kutu", "Vazo", "Tabak", "Bardak", "Kaşık", "Çatal", "Bıçak",
    "Tencere", "Fırın", "Buzdolabı", "Süpürge", "Sabun", "Havlu",
  ],

  doga: [
    "Dağ", "Deniz", "Göl", "Nehir", "Orman", "Ağaç", "Çiçek", "Yaprak",
    "Gökyüzü", "Bulut", "Yıldız", "Ay", "Güneş", "Gezegen", "Rüzgar",
    "Yağmur", "Kar", "Şimşek", "Gökkuşağı", "Volkan", "Ada", "Kıta",
    "Okyanus", "Çöl", "Vadi", "Mağara", "Kaya", "Taş", "Kum", "Toprak",
    "Buz", "Ateş", "Su", "Buzul", "Deprem", "Tsunami", "Kasırga",
    "Kuyruklu Yıldız",
  ],

  yiyecek: [
    "Ekmek", "Peynir", "Süt", "Yumurta", "Bal", "Şeker", "Tuz", "Biber",
    "Domates", "Patates", "Soğan", "Sarımsak", "Havuç", "Elma", "Muz",
    "Portakal", "Limon", "Karpuz", "Çilek", "Kiraz", "Üzüm", "İncir",
    "Nar", "Ceviz", "Fındık", "Badem", "Pirinç", "Makarna", "Çorba",
    "Pizza", "Kahve", "Çay", "Pasta", "Dondurma", "Çikolata",
  ],

  yerlerVeYapilar: [
    "Ev", "Okul", "Hastane", "Cami", "Kilise", "Köprü", "Kule", "Kale",
    "Saray", "Müze", "Kütüphane", "Market", "Restoran", "Otel",
    "Havalimanı", "İstasyon", "Liman", "Fabrika", "Çiftlik", "Bahçe",
    "Park", "Stadyum", "Sinema", "Tiyatro", "Banka", "Eczane",
    "Fırın Dükkanı", "Berber",
  ],

  ulasim: [
    "Araba", "Otobüs", "Kamyon", "Tren", "Uçak", "Gemi", "Bisiklet",
    "Motosiklet", "Helikopter", "Roket", "Traktör", "Taksi", "Vapur",
    "Kano", "Tekne", "Balon", "Metro", "Kaykay", "Paraşüt",
  ],

  meslekVeRoller: [
    "Doktor", "Öğretmen", "Mühendis", "Avukat", "Polis", "Asker", "Aşçı",
    "Garson", "Pilot", "Kaptan", "Ressam", "Müzisyen", "Şarkıcı",
    "Dansçı", "Yazar", "Gazeteci", "Fotoğrafçı", "Marangoz", "Çiftçi",
    "Balıkçı", "Eczacı", "Hemşire", "İtfaiyeci", "Sihirbaz", "Palyaço",
    "Kral", "Kraliçe", "Şövalye", "Prens", "Prenses", "Casus", "Korsan",
    "Dedektif", "Hırsız",
    // yeni eklenenler
    "İmparator", "Sultan", "Vezir", "Elçi", "İsyancı", "Kahraman",
    "Hain", "Mimar", "Bilim İnsanı",
  ],

  spor: [
    "Futbol", "Basketbol", "Voleybol", "Tenis", "Yüzme", "Koşu", "Güreş",
    "Boks", "Satranç", "Bowling", "Golf", "Kayak", "Paten", "Okçuluk",
    "Top", "Kupa", "Madalya", "Düdük",
    // yeni eklenenler
    "Olimpiyat", "Şampiyonluk",
  ],

  vucut: [
    "Baş", "Göz", "Kulak", "Burun", "Diş", "Dil", "El", "Parmak", "Kol",
    "Bacak", "Kalp", "Beyin",
  ],

  soyutKavramlar: [
    "Zaman", "Para", "Aşk", "Savaş", "Barış", "Müzik", "Sanat", "Bilim",
    "Tarih", "Rüya",
    // yeni eklenenler
    "Özgürlük", "Adalet", "Sonsuzluk", "Kader", "Şans", "Hafıza",
    "Bilinç", "Cesaret", "Sadakat", "İhanet", "Umut", "Korku", "Merak",
    "Sabır", "Güç", "Zafer", "Yenilgi", "Nefret", "Gurur", "Utanç",
  ],

  // --- Yeni kategoriler ---

  ulkeler: [
    "Türkiye", "Almanya", "Fransa", "İtalya", "İspanya", "Yunanistan",
    "Rusya", "Çin", "Japonya", "Hindistan", "Brezilya", "Meksika",
    "Kanada", "Mısır", "Fas", "Kenya", "Nijerya", "İngiltere", "İskoçya",
    "İrlanda", "Norveç", "İsveç", "Finlandiya", "Hollanda", "Belçika",
    "İsviçre", "Avusturya", "Polonya", "Ukrayna", "Portekiz", "Küba",
    "Arjantin", "Şili", "Peru", "Avustralya", "Endonezya", "Tayland",
    "Vietnam", "Kore", "İran",
  ],

  sehirlerVeTarihiMekanlar: [
    "İstanbul", "Paris", "Roma", "Londra", "Berlin", "Kahire", "Atina",
    "Venedik", "Amsterdam", "Moskova", "Pekin", "Tokyo", "Babil",
    "Kudüs", "İskenderiye", "Pompei",
  ],

  tarihVeKultur: [
    "İmparatorluk", "Piramit", "Kolezyum", "Gladyatör", "Firavun",
    "İpek Yolu", "Rönesans", "Devrim", "Bağımsızlık", "Demokrasi",
    "Cumhuriyet", "Medeniyet", "Göçebe", "Fetih", "İsyan", "Antlaşma",
    "Keşif", "Sömürge", "Samuray",
  ],

  bilimVeTeknoloji: [
    "Yapay Zeka", "Robot", "Uydu", "İnternet", "Sanal Gerçeklik",
    "Kripto Para", "Genetik", "Atom", "Galaksi", "Kara Delik", "Element",
    "Molekül", "Virüs", "Aşı", "Nükleer", "Elektrik", "Manyetik",
    "Kuantum", "Evrim",
  ],

  cokAnlamliNesneler: [
    "Taç", "Kılıç", "Kalkan", "Zincir", "Pusula", "Harita", "Hazine",
    "Define", "Labirent", "Maske", "Perde", "Zindan", "Fener", "Çan",
  ],
};

// Geriye dönük uyumluluk / gerektiğinde tüm kelimelere düz erişim için.
export const WORDS = Object.values(WORD_CATEGORIES).flat();

function shuffle(array) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const DIFFICULTIES = ["easy", "medium", "hard"];

// Zor mod için elle hazırlanmış, gerçekten çağrışımsal/anlamsal olarak
// birbirine sıkı bağlı küçük kelime kümeleri (ör. alet + o aleti kullanan
// meslek, ülke + başkenti + simgesi). Amaç sadece "aynı kategori" değil,
// tek bir ipucunun isabetli şekilde ayırt edilmesi gereken gerçek anlam
// yakınlığı yaratmak (ör. "Testere" ve "Marangoz" aynı tahtada olabilir).
export const HARD_CLUSTERS = [
  ["Testere", "Marangoz", "Çekiç"],
  ["Stetoskop", "Doktor", "Hastane"],
  ["Fırça", "Ressam", "Boya"],
  ["Iskarpela", "Heykeltıraş", "Mermer"],
  ["Mikroskop", "Bilim İnsanı", "Laboratuvar"],
  ["İğne", "Terzi", "İplik"],
  ["Objektif", "Fotoğrafçı", "Kamera"],
  ["Bisturi", "Cerrah", "Ameliyat"],
  ["Düdük", "Hakem", "Stadyum"],
  ["Türkiye", "Ankara", "İstanbul"],
  ["Fransa", "Paris", "Eyfel Kulesi"],
  ["İtalya", "Roma", "Kolezyum"],
  ["Japonya", "Tokyo", "Samuray"],
  ["Rusya", "Moskova", "Kremlin"],
  ["Mısır", "Kahire", "Piramit"],
  ["Yunanistan", "Atina", "Akropolis"],
  ["Balina", "Okyanus", "Yunus"],
  ["Aslan", "Savan", "Zebra"],
  ["Penguen", "Antarktika", "Buz"],
  ["Deve", "Çöl", "Vaha"],
  ["Kartal", "Dağ", "Yuva"],
  ["Futbol", "Top", "Kale"],
  ["Boks", "Eldiven", "Ring"],
  ["Okçuluk", "Yay", "Ok"],
  ["Kayak", "Kar", "Pist"],
  ["Yüzme", "Havuz", "Mayo"],
  ["Öğretmen", "Okul", "Tahta"],
  ["Aşçı", "Restoran", "Tencere"],
  ["Polis", "Karakol", "Kelepçe"],
  ["Pilot", "Havalimanı", "Uçak"],
  ["Kaptan", "Gemi", "Liman"],
  ["Avukat", "Mahkeme", "Adalet"],
  ["Berber", "Makas", "Ayna"],
  ["Eczacı", "İlaç", "Reçete"],
  ["İtfaiyeci", "Yangın", "Hortum"],
  ["Çiftçi", "Traktör", "Tarla"],
  ["Balıkçı", "Ağ", "Tekne"],
  ["Astronot", "Roket", "Uzay"],
  ["Dedektif", "İpucu", "Büyüteç"],
  ["Korsan", "Hazine", "Gemi"],
];

// Her seçim fonksiyonu { words, clusters } döner. `clusters`, tahtaya konan
// ve birbiriyle anlamca ilişkili kelime gruplarının listesidir (her biri en
// az 2 kelimelik bir dizi) — bu bilgi board renklerini atarken kullanılır:
// ilişkili kelimeler kasıtlı olarak farklı takımlara/renklere dağıtılır,
// böylece aynı takımda toplanıp kolay bir ipucu fırsatına dönüşmezler.

function pickEasyWords(count) {
  // Kolay: kategorisiz, tamamen bağımsız rastgele kelimeler — kelimeler
  // birbiriyle çakışmaz, ipucu vermek en kolay olan mod.
  return { words: shuffle(WORDS).slice(0, count), clusters: [] };
}

// Orta: kategorileri karıştırıp her birinden birkaç kelimelik bir "küme"
// alır — böylece aynı tahtada birbirine yakın kelimeler bir arada bulunur
// (ör. birkaç hayvan adı, birkaç ülke adı aynı anda tahtada olabilir).
function pickMediumWords(count) {
  const categories = shuffle(Object.values(WORD_CATEGORIES));
  const chosen = [];
  const used = new Set();
  const clusters = [];

  for (const category of categories) {
    if (chosen.length >= count) break;
    const pool = shuffle(category);
    const clusterSize = Math.min(pool.length, 3 + Math.floor(Math.random() * 3)); // 3-5
    const clusterWords = [];
    for (const word of pool) {
      if (clusterWords.length >= clusterSize || chosen.length >= count) break;
      if (used.has(word)) continue;
      used.add(word);
      chosen.push(word);
      clusterWords.push(word);
    }
    if (clusterWords.length >= 2) clusters.push(clusterWords);
  }

  fillRemaining(chosen, used, count);
  return { words: shuffle(chosen).slice(0, count), clusters };
}

// Zor: HARD_CLUSTERS içindeki elle kürate edilmiş, birbiriyle gerçekten
// ilişkili küçük kelime kümelerini tahtaya bilerek yerleştirir. Bir
// oyuncunun aynı ipucuyla birden fazla, birbirine yakın anlamlı kelime
// arasında seçim yapması gerekebilir (ör. "Testere" ve "Marangoz").
function pickHardWords(count) {
  const shuffledClusters = shuffle(HARD_CLUSTERS);
  const chosen = [];
  const used = new Set();
  const clusters = [];

  for (const cluster of shuffledClusters) {
    if (chosen.length >= count) break;
    const clusterWords = [];
    for (const word of shuffle(cluster)) {
      if (chosen.length >= count) break;
      if (used.has(word)) continue;
      used.add(word);
      chosen.push(word);
      clusterWords.push(word);
    }
    if (clusterWords.length >= 2) clusters.push(clusterWords);
  }

  fillRemaining(chosen, used, count);
  return { words: shuffle(chosen).slice(0, count), clusters };
}

function fillRemaining(chosen, used, count) {
  if (chosen.length >= count) return;
  const rest = shuffle(WORDS).filter((w) => !used.has(w));
  for (const word of rest) {
    if (chosen.length >= count) break;
    used.add(word);
    chosen.push(word);
  }
}

// Tahta için `count` kelime seçer. `difficulty`:
// - "easy": tamamen bağımsız rastgele kelimeler.
// - "medium": aynı kategoriden kümeler halinde seçim (varsayılan).
// - "hard": elle hazırlanmış, sıkı ilişkili kelime kümeleri (HARD_CLUSTERS).
// Dönüş: { words: string[25], clusters: string[][] }
export function pickBoardWords(count = 25, difficulty = "medium") {
  if (difficulty === "easy") return pickEasyWords(count);
  if (difficulty === "hard") return pickHardWords(count);
  return pickMediumWords(count);
}
