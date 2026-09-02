# Ver İpin Ucunu — Çok Oyunculu Kelime Oyunu

Gerçek zamanlı, mobil öncelikli, Türkçe, takım halinde oynanan bir kelime ilişkilendirme oyunu.

- **Backend:** Node.js + Express + Socket.io (oda durumu tamamen sunucu belleğinde tutulur)
- **Frontend:** React (Vite) + Tailwind CSS

## Klasör Yapısı

```
codenames/
├── package.json            # kök script'ler (ikisini birden çalıştırmak için)
├── server/
│   ├── package.json
│   └── src/
│       ├── index.js        # Express + Socket.io giriş noktası
│       ├── roomManager.js  # oda/oyuncu durumu ve oyun aksiyonları
│       ├── gameLogic.js    # tahta üretimi, takım mantığı, yardımcılar
│       └── words.js        # 300 Türkçe kelime havuzu
└── client/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── context/GameContext.jsx   # socket bağlantısı ve global oyun state'i
        ├── lib/socket.js
        ├── screens/HomeScreen.jsx
        ├── screens/LobbyScreen.jsx
        ├── screens/GameScreen.jsx
        └── components/{Card,Timer}.jsx
```

## Kurulum ve Çalıştırma

Node.js 18+ gereklidir.

### Hızlı başlangıç (önerilen)

Kök dizinde:

```bash
npm run install:all
npm run dev
```

Bu, backend'i `http://localhost:3001` üzerinde, frontend'i `http://localhost:5173` üzerinde aynı anda başlatır (`concurrently` paketiyle).

### Manuel (iki ayrı terminal)

**Terminal 1 — sunucu:**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 — istemci:**
```bash
cd client
npm install
cp .env.example .env   # gerekirse VITE_SERVER_URL'i düzenleyin
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini açın.

### Telefondan test etmek

Aynı Wi-Fi ağındaki bir telefondan test etmek için:

1. Bilgisayarınızın yerel ağ IP adresini bulun (örn. `192.168.1.20`).
2. `client/.env` içinde `VITE_SERVER_URL=http://192.168.1.20:3001` olarak ayarlayın.
3. `npm run dev -- --host` zaten `vite.config.js` içinde `host: true` ile açık; telefondan `http://192.168.1.20:5173` adresine gidin.

### Tek bilgisayarda birden fazla oyuncu simüle etmek

Oyunu başlatmak için en az 4 oyuncu (her takımda 1 Ajan + en az 1 Operatör) gerekir. Aynı tarayıcıdaki normal sekmeler aynı oturum kimliğini paylaşır, bu yüzden her sekme birbirinin yerine geçer. Bunu aşmak için her sekmede farklı bir `?player=` parametresi kullanın — her biri kendi bağımsız kimliğini alır:

- `http://localhost:5173/?player=1`
- `http://localhost:5173/?player=2`
- `http://localhost:5173/?player=3`
- `http://localhost:5173/?player=4`

Her sekmede farklı bir rumuz girip aynı oda koduna katılarak 4 oyunculu bir oyunu tek başınıza test edebilirsiniz.

## Oyun Akışı

1. **Ana Ekran** — rumuz gir, "Oyun Oluştur" ile oda kur ya da "Oyuna Katıl" ile kod gir.
2. **Lobi** — oda kodu paylaşılır; oyuncular boş yuvalara tıklayarak (Manuel Seçim) ya da "Rastgele Dağıt" ile Kırmızı/Mavi takımlara, Ajan/Operatör rollerine atanır. Her takımda tam olarak 1 Ajan ve en az 1 Operatör olduğunda oda kurucusu oyunu başlatabilir.
3. **Oyun Tahtası** — 5x5, 25 kelimelik tahta. Başlangıç takımı 9, diğeri 8, 7 nötr, 1 suikastçı kart alır. Ajanlar tüm renkleri her zaman görür; Operatörler yalnızca açılan kartların rengini görür.
   - Sıradaki takımın Ajanı bir ipucu kelimesi + sayı verir.
   - Operatörler kart açar: kendi renkleri çıkarsa tahmine devam edebilir, rakip/nötr çıkarsa sıra otomatik geçer, suikastçı çıkarsa oyun anında biter.
   - "Turu Bitir" butonuyla operatörler süre dolmadan sırayı devredebilir.
   - Her tur için 90 saniyelik geri sayım vardır; süre dolunca sıra otomatik olarak diğer takıma geçer.
4. Oyun bittiğinde oda kurucusu "Yeni Oyun Başlat" (aynı takımlarla yeni tahta) veya "Lobiye Dön" seçebilir.

## Notlar

- Oyun durumu tamamen sunucu belleğinde tutulur (kalıcı veritabanı yoktur); sunucu yeniden başlatıldığında tüm odalar sıfırlanır.
- Oyuncular sayfayı yenilerse veya bağlantısı kısa süreliğine kesilirse, tarayıcıda saklanan kimlikle otomatik olarak aynı odaya ve role geri döner.
- 30 dakika boyunca hiç bağlı oyuncusu kalmayan odalar bellekten otomatik temizlenir.
