# zkBank Web Application

Modern web arayüzü ile Sui blockchain üzerinde zero-knowledge banking işlemleri yapabilirsiniz.

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js (v16 veya üzeri)
- Python 3 (web sunucusu için)
- Modern web tarayıcısı

### Kurulum

1. **API'yi başlatın:**

```bash
cd api
npm install
npm start
```

API http://localhost:3001 adresinde çalışacak.

2. **Web arayüzünü başlatın:**

```bash
cd frontend
python3 -m http.server 3000
```

Web sitesi http://localhost:3000 adresinde açılacak.

3. **Tarayıcıda açın:**

```
http://localhost:3000
```

## 🎯 Özellikler

### 📊 Dashboard

- **İstatistik Kartları**: Toplam, bekleyen, tamamlanan ve noterize edilmiş işlemler
- **Gerçek Zamanlı Güncellemeler**: 30 saniyede bir otomatik yenileme
- **Modern UI**: Glass morphism tasarım ile şık arayüz

### 💼 İşlem Yönetimi

- **İşlem Oluşturma**: Initiator, counterparty, miktar ve imza gereksinimleri
- **Çoklu İmza Desteği**: 1-10 arası gerekli imza sayısı
- **Noter İmzası**: Opsiyonel noter onayı
- **İşlem Durumu Takibi**: Pending → Ready for Notary → Ready for Completion → Completed

### 🔐 Güvenlik

- **Zero-Knowledge Proofs**: İşlem detayları gizli tutulur
- **Çoklu İmza Doğrulama**: Güvenli işlem onayı
- **Noter Onayı**: Ek güvenlik katmanı
- **Rate Limiting**: API koruması

## 🛠️ API Endpoints

### İşlem Yönetimi

- `POST /api/transactions/create` - Yeni işlem oluştur
- `POST /api/transactions/:id/sign` - İmza ekle
- `POST /api/transactions/:id/notarize` - Noter imzası ekle
- `POST /api/transactions/:id/complete` - İşlemi tamamla

### Veri Alma

- `GET /api/transactions` - Tüm işlemleri listele
- `GET /api/transactions/:id` - Belirli işlemi getir
- `GET /api/transactions/:id/status` - İşlem durumunu getir
- `GET /api/health` - API sağlık kontrolü

### Demo

- `POST /api/demo/create-sample` - Örnek işlem oluştur

## 📱 Kullanım Senaryoları

### 1. Basit İşlem Oluşturma

1. "Create Transaction" formunu doldurun
2. Initiator ve counterparty adreslerini girin
3. Miktarı belirtin (MIST cinsinden)
4. Gerekli imza sayısını ayarlayın
5. "Create Transaction" butonuna tıklayın

### 2. İmza Ekleme

1. Oluşturulan işlem ID'sini kopyalayın
2. "Add Signature" formunu doldurun
3. İmzalayan adresi girin
4. "Add Signature" butonuna tıklayın

### 3. Noter İmzası

1. Yeterli imza eklendikten sonra
2. "Add Notary Signature" formunu doldurun
3. Noter adresini girin
4. "Add Notary Signature" butonuna tıklayın

### 4. İşlem Tamamlama

1. Tüm gereksinimler karşılandıktan sonra
2. "Complete Transaction" formunu doldurun
3. İşlem ID'sini girin
4. "Complete Transaction" butonuna tıklayın

## 🎨 UI Özellikleri

### Responsive Tasarım

- Mobil uyumlu arayüz
- Tablet ve desktop optimizasyonu
- Touch-friendly butonlar

### Animasyonlar

- Smooth scroll efektleri
- Fade-in animasyonları
- Loading spinner'ları
- Hover efektleri

### Bildirimler

- Başarı/hata mesajları
- Toast notification'ları
- Otomatik kaybolma

## 🔧 Geliştirme

### Dosya Yapısı

```
frontend/
├── index.html      # Ana HTML dosyası
├── styles.css      # Özel CSS stilleri
└── script.js       # JavaScript uygulaması

api/
├── server.js       # Express API sunucusu
├── package.json    # Node.js bağımlılıkları
└── env.example     # Örnek environment değişkenleri
```

### Özelleştirme

- `styles.css` dosyasında renkleri değiştirin
- `script.js` dosyasında API endpoint'lerini güncelleyin
- `server.js` dosyasında blockchain entegrasyonunu geliştirin

## 🚀 Production Deployment

### Environment Variables

```bash
# .env dosyası oluşturun
PORT=3001
SUI_NETWORK=mainnet
SUI_PACKAGE_ID=your_package_id
SUI_NOTARY_CAP_ID=your_notary_cap_id
JWT_SECRET=your_secret_key
```

### Docker Deployment

```dockerfile
# Dockerfile örneği
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🔍 Debugging

### API Logları

```bash
# API loglarını görüntüle
cd api
npm run dev
```

### Browser Console

- F12 tuşuna basın
- Console sekmesini açın
- Hata mesajlarını kontrol edin

### Network Requests

- Browser DevTools'da Network sekmesini açın
- API çağrılarını izleyin
- Response'ları kontrol edin

## 📈 Gelecek Özellikler

- [ ] Gerçek Sui wallet entegrasyonu
- [ ] ZKP proof generation
- [ ] Multi-language desteği
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] WebSocket real-time updates
- [ ] Advanced security features

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👨‍💻 Geliştirici

**Zeki N. (nzengi)**  
Email: howyaniii@gmail.com

---

**Not**: Bu prototip demo amaçlıdır. Production kullanımı için ek güvenlik önlemleri alınmalıdır.
