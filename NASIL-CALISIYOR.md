# Ver İpin Ucunu — Baştan Sona Nasıl Çalışıyor?

Bu dosya, projeyi hiç bilmeyen biri (ya da birkaç ay sonra kendi kodunu unutmuş sen) için baştan sona anlatılmış bir rehber. Terimler ilk geçtiği yerde açıklanıyor.

---

## 1. Bu proje ne?

Fiziksel "kelime tahmin" kutu oyununun web üzerinden, gerçek zamanlı, çok oyunculu bir versiyonu. Bir kişi oda kurar, arkadaşları oda koduyla katılır, herkes aynı 5x5 kelime tahtasını aynı anda görür ve tıkladıkları anda diğer herkesin ekranında da değişiklik anında yansır.

**"Gerçek zamanlı" olması** buradaki en önemli teknik zorluk. Normal bir web sitesi (mesela bir haber sitesi) şöyle çalışır: tarayıcı sunucuya "bana şu sayfayı ver" diye bir istek atar, sunucu cevap verir, bağlantı kapanır. Buna **HTTP** denir — bir mektup gönderip cevap beklemek gibi düşünebilirsin.

Ama bizim oyunumuzda öyle olmuyor: Ali bir karta tıkladığında, Ayşe'nin ekranının **beklemeden, anında** güncellenmesi lazım. Bunun için **WebSocket** denen bir teknoloji kullanılıyor — telefon hattını açık tutmak gibi düşün, iki taraf da istediği an konuşabiliyor, sürekli yeni "mektup" göndermeye gerek yok. Biz WebSocket'i doğrudan değil, onu kolay kullanılır hale getiren **Socket.io** adlı kütüphane üzerinden kullanıyoruz.

---

## 2. Kullanılan teknolojiler (herkes için tek tek)

| Teknoloji | Ne işe yarar | Basit tarifi |
|---|---|---|
| **Node.js** | JavaScript'i tarayıcı dışında çalıştırır | Normalde JavaScript sadece tarayıcıda çalışır. Node.js, aynı dili bir sunucu bilgisayarında da çalıştırabilmeyi sağlayan bir "motor". |
| **Express** | Node üzerinde web sunucusu kurar | "Birisi `/health` adresine istek atarsa şunu yap" gibi kuralları tanımlamayı kolaylaştıran bir kütüphane. |
| **Socket.io** | Gerçek zamanlı iki yönlü iletişim | WebSocket'i kullanışlı hale getirir: "oda" (room) kavramı, otomatik yeniden bağlanma, olay (event) bazlı mesajlaşma. |
| **React** | Arayüz oluşturur | Ekranı küçük, tekrar kullanılabilir parçalara ("bileşen"/component) bölerek yönetmeni sağlar — mesela `Card` bileşeni tek bir kelime kartını temsil eder, 25 tanesi tahtayı oluşturur. |
| **Vite** | React kodunu tarayıcı için hazırlar | Yazdığın `.jsx` dosyalarını tarayıcının anlayacağı JavaScript'e çevirir, geliştirirken anlık önizleme sağlar. |
| **Tailwind CSS** | Görünüm/stil | Stil yazmak için `bg-red-600` (kırmızı arka plan), `rounded-xl` (yuvarlak köşe) gibi hazır "kelimeler" sunan bir araç. Ayrı `.css` dosyaları yazmak yerine class isimleri kullanılıyor. |

**Özet:** Backend (sunucu) = Node.js + Express + Socket.io. Frontend (tarayıcıda çalışan kısım) = React + Vite + Tailwind. İkisi de JavaScript, TypeScript yok.

---

## 3. Klasör haritası

```
ver-ipin-ucunu/
├── server/                    ← Backend (Node.js)
│   └── src/
│       ├── index.js           ← Giriş noktası: sunucuyu ayağa kaldırır, socket olaylarını dinler
│       ├── roomManager.js     ← Oda ve oyuncu durumunu tutar, oyun kurallarını uygular
│       ├── gameLogic.js       ← Saf yardımcı fonksiyonlar (tahta üretme, kazanma kontrolü)
│       └── words.js           ← 300 kelimelik liste
│
└── client/                    ← Frontend (React)
    └── src/
        ├── main.jsx           ← React'i sayfaya "yerleştiren" ilk dosya
        ├── App.jsx            ← Hangi ekranın gösterileceğine karar verir
        ├── context/
        │   └── GameContext.jsx← Sunucuyla konuşan merkezi "beyin"
        ├── lib/
        │   ├── socket.js      ← Socket.io bağlantısı + kimlik (localStorage) yönetimi
        │   └── sound.js       ← Ses efektleri
        ├── screens/           ← Tam sayfa ekranlar (Ana Sayfa, Lobi, Oyun Tahtası)
        └── components/        ← Küçük, tekrar kullanılan parçalar (Kart, Zamanlayıcı)
```

---

## 4. Backend, dosya dosya

### `words.js`
En basit dosya: 300 Türkçe kelimenin bulunduğu bir liste (array). Başka hiçbir şey yapmıyor.

### `gameLogic.js`
Burada **saf fonksiyonlar** var — yani girdi alıp çıktı veren, hiçbir "durum" (state) tutmayan, yan etkisi olmayan fonksiyonlar. Örnekler:
- `generateBoard(startingTeam)` → 25 kelime seçer, 9/8/7/1 dağılımıyla renklere atar, karıştırır.
- `remainingCounts(board)` → kaç kırmızı/mavi kelimenin hâlâ açılmadığını sayar.
- `switchTurn(room)` → sırayı diğer takıma geçirir.

Bu fonksiyonların "saf" olması test edilmelerini kolaylaştırır: aynı girdiyi verirsen (rastgelelik hariç) hep aynı sonucu alırsın, hiçbir gizli bağımlılığı yok.

### `roomManager.js` — projenin kalbi
Burada bir tane dev bir "hafıza deposu" var:

```js
const rooms = new Map(); // roomCode -> oda bilgisi
```

`Map`, JavaScript'te "anahtar → değer" eşlemesi tutan bir veri yapısı (bir sözlük gibi düşün: "ABCDE" oda koduna karşılık o odanın tüm bilgisi). **Bu tamamen bilgisayarın RAM'inde (bellekte) tutuluyor, hiçbir veritabanı yok.** Yani sunucu yeniden başlatılırsa (deploy, çökme, vs.) bütün açık odalar sıfırlanır. Küçük/hobi projeler için bu kabul edilebilir bir basitleştirme.

Her oda şöyle bir şey:
```js
{
  code: "A3XQ9",
  players: Map(...),       // kim hangi takımda, hangi rolde
  phase: "lobby",          // lobby | playing | ended
  board: [...],             // 25 kart
  turn: "red",              // sıradaki takım
  clue: null,                // aktif ipucu
  matchScore: { red: 0, blue: 0 },
}
```

Bu dosyadaki fonksiyonlar (`startGame`, `giveClue`, `revealCard`, `endTurn`...) hepsi aynı kalıbı izliyor: bir odayı ve bir oyuncu kimliğini alır, kuralları kontrol eder (örneğin "senin sıran değil" ise hata döner), uygunsa `room` objesini değiştirir.

**İkinci bir Map daha var, çok önemli:**
```js
const socketIndex = new Map(); // socket.id -> { roomCode, clientId }
```
Neden gerekli? Bir tarayıcı sekmesi internete her bağlandığında Socket.io ona **yeni bir `socket.id`** verir (bağlantı kopup tekrar kurulsa bile değişir). Ama biz "bu Ahmet, az önce Kırmızı Ajan'dı" bilgisini kaybetmek istemiyoruz. Bunun için tarayıcı `localStorage`'da (tarayıcıda kalıcı olarak saklanan küçük bir veri deposu) kendine sabit bir `clientId` üretip saklıyor ([bkz. `client/src/lib/socket.js`](client/src/lib/socket.js)). Bağlantı koptuğunda, yeni `socket.id` geldiğinde sunucu bu `clientId`'yi tanıyıp "ha, bu Ahmet'ti" diyerek onu kaldığı yere geri koyuyor. Buna **reconnect (yeniden bağlanma) mantığı** deniyor.

### `index.js` — sunucunun giriş kapısı
Burada üç şey oluyor:
1. **Express kurulumu** — `/health` gibi normal HTTP adresleri, ayrıca (canlıya alırken) React'in derlenmiş halini sunmak için.
2. **Socket.io kurulumu** — gelen her bağlantı için `socket.on("olay_adı", ...)` şeklinde dinleyiciler kuruluyor (`create_room`, `join_room`, `give_clue`, `reveal_card`, vs.)
3. **Tur zamanlayıcısı** — her tur başladığında `setTimeout` ile 90 saniyelik bir sayaç kuruluyor; süre dolarsa sunucu kendisi sırayı diğer takıma geçiriyor. **Bu bilerek sunucu tarafında** — istemcinin (tarayıcının) saatine güvenilmiyor, çünkü biri saatini değiştirebilir ya da tarayıcı sekmesi arka plana atılıp yavaşlayabilir. Sunucu her zaman "gerçek" kaynak (tek doğru).

**En kritik tasarım kararı burada:** Normalde Socket.io'da "odadaki herkese aynı mesajı gönder" (`io.to(room).emit(...)`) kullanılır. Ama bizim oyunumuzda bu işe yaramaz, çünkü **Ajan (Spymaster) ile Operatör aynı anda farklı şeyler görmeli** — Ajan tüm renkleri bilir, Operatör bilmez. Bu yüzden `broadcastState()` fonksiyonu odadaki her oyuncuya **ayrı ayrı, kişiye özel** bir mesaj gönderiyor:

```js
for (const player of room.players.values()) {
  socket.emit("state", getPublicState(room, player.clientId)); // her oyuncuya kendine özel görünüm
}
```

`getPublicState(room, clientId)` fonksiyonu ([`roomManager.js`](server/src/roomManager.js)) "bu kişi Ajan mı?" diye bakıyor, öyleyse tüm kart renklerini gönderiyor, değilse sadece açılmış kartların rengini gönderiyor. Oyun bittiğinde de herkes tüm renkleri görsün diye aynı mantık kullanılıyor (`phase === "ended"` ise herkese Ajan gibi davranılıyor).

---

## 5. Frontend, dosya dosya

### `main.jsx`
En dıştaki dosya. React'i tarayıcıdaki `<div id="root">` elemanının içine "yerleştiriyor". Neredeyse hiç değişmeyen, standart bir başlangıç dosyası.

### `App.jsx`
Bir **router** (sayfa yönlendirici) gibi düşünülebilir ama aslında değil — burada sadece sunucudan gelen `state.phase` değerine bakılıyor:
```jsx
!state ? <HomeScreen /> : state.phase === "lobby" ? <LobbyScreen /> : <GameScreen />
```
Yani hangi ekranın gösterileceğine URL değil, **sunucudan gelen oyun durumu** karar veriyor.

### `context/GameContext.jsx`
React'te "Context", bir bilgiyi (mesela mevcut oyun durumunu) her bileşene tek tek elle taşımadan (buna **prop drilling** denir, yani veriyi ata-çocuk-torun zinciriyle elden ele taşımak) herkesin doğrudan erişebilmesini sağlayan bir mekanizma. Bu dosya:
- Socket.io bağlantısını kuruyor,
- `socket.on("state", ...)` ile sunucudan gelen her güncellemeyi dinliyor,
- `giveClue()`, `revealCard()` gibi fonksiyonlar sunuyor — bunlar arka planda `socket.emit(...)` çağrısı yapıp sunucudan cevap (**ack**, "acknowledgement" — "aldım, işte sonucu" cevabı) bekliyor.

Herhangi bir ekran `useGame()` yazarak bu bilgiye ve fonksiyonlara direkt ulaşabiliyor.

### `lib/socket.js`
Socket.io bağlantı nesnesini oluşturur, `clientId`'yi `localStorage`'da saklar/okur.

### `lib/sound.js`
Hiç ses dosyası kullanmıyor — **Web Audio API** ile (tarayıcının kendi ses üretme özelliği) anlık ton/bip sesleri üretiyor. Bunun avantajı: internetten dosya indirmeye gerek yok, telif hakkı derdi yok, dosya boyutu neredeyse sıfır.

### `screens/`
Üç tam sayfa: `HomeScreen` (rumuz gir, oda oluştur/katıl), `LobbyScreen` (takım seçimi), `GameScreen` (asıl oyun tahtası).

### `components/`
`Card.jsx` (tek bir kelime kartı — rengi `revealed` ve `isSpymaster` bilgisine göre değişiyor) ve `Timer.jsx` (geri sayım gösterimi, sunucudan gelen `turnEndsAt` zaman damgasını kullanıyor).

---

## 6. Uçtan uca bir oyunun hikayesi

1. **Ali `HomeScreen`'de "Oyun Oluştur"a basar** → istemci `socket.emit("create_room", {nickname, clientId})` gönderir.
2. **Sunucu**, `roomManager.createRoom()` çağırır: rastgele bir oda kodu üretir, `rooms` Map'ine yeni bir oda ekler, Ali'yi o odanın ilk oyuncusu (ve kurucusu/host'u) yapar.
3. **Sunucu**, `broadcastState()` ile Ali'ye (şu an odadaki tek kişi) yeni durumu gönderir. Ali'nin ekranında `state.phase === "lobby"` olduğu için otomatik olarak `LobbyScreen`'e geçilir.
4. **Ayşe, oda koduyla katılır** ("Oyuna Katıl") → `join_room` olayı → sunucu onu da odaya ekler → **hem Ali'ye hem Ayşe'ye** yeni oyuncu listesini gönderir (Ali artık Ayşe'yi de lobide görür).
5. Herkes takım/rol seçer (`select_role` olayı) ya da host "Rastgele Dağıt"a basar.
6. Host "Oyunu Başlat"a basınca → `startGame()` çalışır: 25 kelime seçilir, renkler dağıtılır, `phase = "playing"` olur, 90 saniyelik tur zamanlayıcısı kurulur.
7. **Sıradaki takımın Ajanı ipucu verir** → `give_clue` → sunucu `room.clue`'yu doldurur → herkese yayınlanır.
8. **Operatör bir karta tıklar** → `reveal_card` → sunucu kartın gerçek rengini açığa çıkarır, kazanma koşulunu kontrol eder (o rengin son kartı mıydı? suikastçı mıydı?), gerekiyorsa sırayı değiştirir → **yine herkese, ama kişiye özel görünümle** yayınlanır.
9. Bir takım kazanınca `phase = "ended"` olur, `matchScore` güncellenir, herkesin ekranında tüm tahta açılır ve kazanma ekranı (`EndOverlay`) çıkar.

Bütün bu adımlarda istemci **hiçbir zaman kendi başına karar vermiyor** — sadece sunucuya "şunu yapmak istiyorum" diyor, sunucu kuralları kontrol edip son kararı veriyor, sonucu herkese dağıtıyor. Buna **sunucu-otoriter (server-authoritative) mimari** denir; oyunlarda hile/tutarsızlığı önlemenin standart yolu budur.

---

## 7. Sözlük

| Terim | Anlamı |
|---|---|
| **API** | Bir programın diğer programlarla konuşmak için sunduğu "arayüz" / kurallar bütünü. |
| **Endpoint** | Bir API'de belirli bir isteğin gittiği adres (mesela `/health`). |
| **Event (olay)** | Socket.io'da "bir şey oldu" bildirimi (`give_clue`, `state` gibi isimlerle). |
| **State (durum)** | O anki verinin anlık hali — burada "oda ve oyunun şu anki durumu". |
| **Component (bileşen)** | React'te arayüzün küçük, tekrar kullanılabilir bir parçası (fonksiyon olarak yazılır). |
| **Hook** | React'te `use` ile başlayan, bileşenlere state/yan etki gibi yetenekler katan fonksiyonlar (`useState`, `useEffect`, `useGame`). |
| **JSX** | React'te JavaScript içine HTML benzeri kod yazmayı sağlayan söz dizimi. |
| **Props** | Bir bileşene dışarıdan geçirilen parametreler (fonksiyon argümanı gibi). |
| **Middleware** | Express'te bir isteğin, asıl işleme ulaşmadan önceden geçtiği ara katman (örn. `cors()`). |
| **Ack (acknowledgement)** | Socket.io'da bir mesaja karşılık gelen, "aldım, işte sonuç" cevabı. |

---

## 8. Çalıştırma ve deploy (kısa hatırlatma)

- **Yerel geliştirme:** kök dizinde `npm run install:all && npm run dev` — backend `:3001`, frontend `:5173`.
- **Telefon/aynı ağ:** `client/.env` içine `VITE_SERVER_URL=http://<bilgisayarın-IP'si>:3001`, sonra `npm run dev` yeniden başlatılmalı (env değişkenleri sadece açılışta okunur).
- **Canlıya alma:** `render.yaml` hazır — Render.com'da bu repoyu bağlayıp deploy etmek yeterli, ücretsiz katman kullanılabilir, domain gerekmez (detaylar `README.md`'de).

Daha fazla detay ve kurulum adımları için: [`README.md`](README.md).
