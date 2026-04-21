

# Plan: Build U-Cabo Marketplace Prototype

Terima kasih untuk logonya! Saya akan membangun prototype UI lengkap untuk U-Cabo berdasarkan dokumen spesifikasi dan logo yang diberikan.

## Brand Identity
- **Logo**: U-Cabo logo yang di-upload akan digunakan di seluruh aplikasi
- **Warna**: Putih/abu-abu netral + aksen biru navy (#1B3A5C) dan oranye (#E8751A) sesuai warna logo
- **Gaya**: Clean, minimalis, mobile-first

## Halaman yang Akan Dibuat

### 1. Homepage / Marketplace
- Header dengan logo U-Cabo + search bar
- Grid produk (card: gambar, nama, harga, kondisi baru/bekas)
- Bottom navigation: Home, Chat, Jual, Profil
- Dummy data realistis (barang mahasiswa: laptop, buku, dll)

### 2. Detail Produk
- Gambar produk besar
- Nama, harga, deskripsi, bagian "minus" (kekurangan)
- Info seller dengan badge verifikasi
- Tombol "Chat Seller" dan "Beli Sekarang"

### 3. Chat (WhatsApp-style)
- List chat dan detail percakapan
- Bubble kiri/kanan, scrollable, input + tombol kirim

### 4. Seller Dashboard
- List produk yang dijual dengan status (aktif/terjual)
- Tombol tambah produk, edit, hapus

### 5. KYC / Verifikasi Seller
- Upload foto KTM + selfie dengan KTM
- Instruksi jelas, status (pending/approved/rejected)

### 6. Admin Panel
- Sidebar layout
- List pengajuan KYC (approve/reject)
- List user dan transaksi

## Detail Teknis
- React + TypeScript + Tailwind CSS
- React Router untuk navigasi antar halaman
- Semua data dummy (tidak ada backend)
- Mobile-first responsive design
- Logo di-copy ke `src/assets/` dan di-import sebagai modul

## File Structure
```
src/
  assets/u-cabo-logo.png
  pages/
    Index.tsx (Homepage)
    ProductDetail.tsx
    ChatList.tsx
    ChatDetail.tsx
    SellerDashboard.tsx
    KYCVerification.tsx
    AdminPanel.tsx
    Profile.tsx
    SellProduct.tsx
  components/
    BottomNav.tsx
    ProductCard.tsx
    ChatBubble.tsx
    AdminSidebar.tsx
```

Ini adalah prototype UI statis dengan dummy data — fokus pada usability dan tampilan clean.

