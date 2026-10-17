# 🎓 ITERA Student Hub — Personal Dashboard

> Aplikasi Personal Dashboard berbasis web untuk mahasiswa ITERA yang membantu mengelola jadwal kuliah, daftar tugas, dan catatan penting dalam satu tampilan yang interaktif dan modern.

---

## 📋 Deskripsi Aplikasi

**ITERA Student Hub** adalah aplikasi dashboard pribadi yang dirancang khusus untuk membantu produktivitas dan organisasi sehari-hari mahasiswa. Aplikasi ini berjalan sepenuhnya di browser (client-side) tanpa memerlukan server backend, dan seluruh data tersimpan secara lokal di perangkat pengguna menggunakan `localStorage`.

Aplikasi ini terdiri dari **satu halaman** (`index.html`) dengan desain responsif yang dapat digunakan di desktop maupun perangkat mobile.

---

## ✨ Fitur-Fitur Utama

### 1. 📅 Jadwal Kuliah
- **Tambah** jadwal mata kuliah lengkap dengan hari, jam, dan ruang kelas
- **Edit** jadwal yang sudah ada
- **Hapus** jadwal yang tidak dibutuhkan lagi
- **Filter berdasarkan hari** (Senin–Sabtu) menggunakan tab navigasi
- Jadwal otomatis terurut berdasarkan waktu

### 2. ✅ Daftar Tugas (To-Do List)
- **Tambah** tugas baru dengan judul, deskripsi, prioritas, dan deadline
- **Edit** dan **hapus** tugas
- **Tandai selesai/belum selesai** dengan satu klik pada checkbox
- **Filter** tampilan: Semua / Aktif / Selesai
- **Prioritas visual**: badge warna merah (tinggi), kuning (sedang), hijau (rendah)
- **Statistik tugas** ditampilkan di bawah daftar (total, selesai, aktif)
- Saat pertama kali dibuka, 5 tugas contoh otomatis di-load dari API JSONPlaceholder

### 3. 📝 Catatan Cepat
- **Tambah** catatan dengan judul dan isi
- **Edit** dan **hapus** catatan
- Ditampilkan dalam format **grid kartu** dengan warna bergantian (kuning, biru, hijau)
- Tanggal pembuatan ditampilkan di setiap kartu

### 4. 🌤️ Widget Cuaca Real-time
- Menampilkan **suhu**, **kondisi cuaca**, **kecepatan angin**, dan **kelembapan** secara real-time
- Data diambil dari **Open-Meteo API** (koordinat: ITERA Lampung Selatan)
- Tombol refresh untuk memperbarui data cuaca
- Deskripsi cuaca dalam Bahasa Indonesia

### 5. 💬 Kutipan Motivasi
- Menampilkan kutipan inspirasi acak di header dashboard
- Data diambil dari **DummyJSON Quotes API**
- Otomatis berubah setiap kali halaman di-refresh

### 6. 🕐 Jam & Tanggal Digital
- Menampilkan jam real-time (update setiap detik)
- Tanggal lengkap dalam format Bahasa Indonesia

### 7. 🔔 Notifikasi Toast
- Notifikasi pop-up muncul saat data berhasil ditambah, diubah, atau dihapus
- Warna berbeda untuk tipe notifikasi: sukses (hijau), error (merah), info (biru)

---

## 🛠️ Teknologi yang Digunakan

| Teknologi | Keterangan |
|-----------|-----------|
| HTML5 | Struktur semantik halaman |
| CSS3 | Styling dengan CSS Custom Properties & Grid/Flexbox |
| JavaScript ES6+ | Logika aplikasi & interaktivitas |
| localStorage | Penyimpanan data di sisi klien |
| Open-Meteo API | Data cuaca real-time (gratis, tanpa API key) |
| DummyJSON API | Kutipan motivasi acak |
| JSONPlaceholder API | Data tugas awal (simulasi) |
| Google Fonts (Inter) | Tipografi modern |
| Lucide Icons | Library ikon SVG |

---

## 📂 Struktur File

```
tugas-praktikum/
├── index.html     → Halaman utama dashboard
├── style.css      → Stylesheet dengan desain responsif
├── app.js         → Logika aplikasi (ES6+ Classes, Arrow Functions, dll.)
├── segitiga.py    → Program segitiga Python (#)
└── README.md      → Dokumentasi proyek (file ini)
```

---

## 🚀 Cara Menjalankan

1. **Download** atau clone seluruh folder proyek
2. **Buka** file `index.html` di browser modern (Chrome, Firefox, Edge)
3. Dashboard akan langsung aktif dan data cuaca serta kutipan motivasi akan otomatis dimuat
4. Semua data yang Anda tambahkan tersimpan otomatis di `localStorage` browser

> **Catatan:** Pastikan koneksi internet aktif agar widget cuaca dan kutipan motivasi dapat berfungsi.

---

## 🔧 Daftar Fitur ES6+ yang Diimplementasikan

Berikut daftar lengkap fitur-fitur JavaScript ES6+ yang digunakan beserta lokasi barisnya di file `app.js`:

### 1. `let` dan `const`
- **Lokasi:** Seluruh file `app.js` (tidak ada penggunaan `var` sama sekali)
- **Contoh:** `const app = new DashboardApp();` (baris 437), `let filtered = [...]` (baris 259)
- **Penjelasan:** `const` digunakan untuk variabel yang nilainya tidak berubah setelah dideklarasikan, sedangkan `let` digunakan untuk variabel yang nilainya bisa berubah (misalnya di dalam fungsi filter).

### 2. Arrow Functions (Minimal 3)
- **`renderScheduleList`** — baris 245: `renderScheduleList = () => { ... }`
- **`renderTaskList`** — baris 261: `renderTaskList = () => { ... }`
- **`renderNotesList`** — baris 309: `renderNotesList = () => { ... }`
- **`renderTaskStats`** — baris 297: `renderTaskStats = () => { ... }`
- **`showToast`** — baris 413: `showToast = (message, type = 'info') => { ... }`
- **Callback arrow functions** di `filter`, `map`, `sort`, `forEach`, `addEventListener` — tersebar di seluruh file
- **Penjelasan:** Arrow function adalah cara menulis fungsi yang lebih ringkas di ES6. Selain itu, arrow function secara otomatis mengikat konteks `this` dari lingkup luarnya, sehingga sangat berguna di dalam class method dan event listener.

### 3. Template Literals
- **Lokasi:** Digunakan di semua fungsi render untuk membangun HTML dinamis
- **Contoh:** baris 195–205 (weather HTML), baris 250–258 (schedule items), baris 272–290 (task items), baris 316–326 (note cards)
- **Penjelasan:** Template literal menggunakan tanda backtick (`` ` ``) untuk membuat string yang bisa memuat ekspresi JavaScript di dalamnya dengan sintaks `${expression}`. Ini sangat berguna untuk memasukkan variabel ke dalam string HTML tanpa harus menggunakan concatenation (+) yang sulit dibaca.

### 4. Async / Await
- **`fetchWeather()`** — baris 170: `async fetchWeather() { ... }`
- **`fetchQuote()`** — baris 211: `async fetchQuote() { ... }`
- **`loadInitialTasks()`** — baris 228: `async loadInitialTasks() { ... }`
- **Penjelasan:** `async/await` adalah fitur ES6+ yang membuat kode asinkron (seperti memanggil API) terlihat seperti kode biasa yang berjalan berurutan. Kata kunci `await` menunggu sebuah Promise selesai sebelum melanjutkan ke baris berikutnya, tanpa perlu menggunakan `.then()` berantai.

### 5. Classes
- **`class TaskItem`** — baris 29: Model data untuk setiap item (tugas/jadwal/catatan)
- **`class DashboardApp`** — baris 81: Controller utama aplikasi yang mengelola state, localStorage, API calls, dan rendering
- **Penjelasan:** Class adalah cara modern di ES6 untuk membuat "cetakan" objek (semacam blueprint). Class TaskItem berfungsi sebagai model data, sedangkan DashboardApp berfungsi sebagai controller yang mengatur seluruh logika aplikasi.

### 6. Destructuring
- **Parameter destructuring** — baris 46–54: `const { description, day, time, ... } = extra;`
- **Objek destructuring** — baris 130: `const { schedules, tasks, notes } = JSON.parse(raw);`
- **Cuaca destructuring** — baris 192: `const { temperature, windspeed, weathercode } = data.current_weather;`
- **Quote destructuring** — baris 219: `const { quote, author } = data;`
- **Map callback destructuring** — baris 238: `todos.map(({ title, completed }) => ...)`
- **Save destructuring** — baris 358: `const { modalMode: mode, editingItem } = this;`
- **Penjelasan:** Destructuring memungkinkan kita mengekstrak nilai dari objek atau array ke dalam variabel terpisah secara ringkas. Ini membuat kode lebih mudah dibaca dan mengurangi pengulangan akses properti.

### 7. Spread Operator (`...`)
- **Menambah item baru ke array** — baris 243: `this.tasks = [...this.tasks, ...newTasks];`
- **Memperbarui item dalam array** — baris 369: `this.schedules[idx] = { ...this.schedules[idx], title, day, time, room };`
- **Salin array untuk filter** — baris 263: `let filtered = [...this.tasks];`
- **Toggle task** — baris 401: `t.id === id ? { ...t, done: !t.done } : t`
- **Penjelasan:** Spread operator (`...`) digunakan untuk "membuka" isi array atau objek. Saat memperbarui data, kita membuat salinan baru alih-alih mengubah data aslinya (immutable update). Ini adalah praktik yang baik untuk menjaga integritas data.

### 8. Default Parameters
- **Constructor TaskItem** — baris 38: `constructor(title, type = 'task', extra = {})`
- **showToast** — baris 413: `showToast = (message, type = 'info') => { ... }`
- **openModal** — baris 333: `openModal(mode, itemId = null)`
- **Penjelasan:** Default parameter memungkinkan kita memberikan nilai bawaan pada parameter fungsi. Jika fungsi dipanggil tanpa argumen tertentu, nilai default yang akan digunakan.

### 9. Enhanced Object Literals
- **Data object shorthand** — baris 116–118: `{ schedules: this.schedules, tasks: this.tasks, notes: this.notes }`
- **Penjelasan:** Di ES6, jika nama properti sama dengan nama variabel, kita bisa menulis `{ schedules }` alih-alih `{ schedules: schedules }`.

### 10. Array Methods (map, filter, find, findIndex)
- **`map`** — baris 251, 273, 316 (rendering daftar)
- **`filter`** — baris 247, 265, 266, 404, 408, 410 (memfilter data)
- **`find`** — baris 339 (mencari item berdasarkan ID)
- **`findIndex`** — baris 367, 379, 391 (mencari index untuk update)
- **Penjelasan:** Method-method array ini sangat powerful untuk mengolah data tanpa menggunakan perulangan `for` tradisional. Semuanya mengembalikan array/nilai baru tanpa mengubah array asli.

---

## 📱 Desain UI/UX

- **Responsif**: Layout otomatis menyesuaikan di desktop (grid multi-kolom) dan mobile (1 kolom)
- **Warna konsisten**: Menggunakan CSS Custom Properties untuk tema warna yang seragam
- **Animasi halus**: Hover effects, modal slide-up, toast slide-in
- **Umpan balik visual**: Toast notification untuk setiap aksi, badge prioritas berwarna
- **Aksesibilitas**: Kontras warna yang baik, ikon deskriptif, font yang mudah dibaca

---

## 📌 API Publik yang Digunakan

| API | Endpoint | Kegunaan |
|-----|----------|----------|
| Open-Meteo | `https://api.open-meteo.com/v1/forecast?latitude=-5.36&longitude=105.31&current_weather=true` | Cuaca real-time kampus ITERA |
| DummyJSON Quotes | `https://dummyjson.com/quotes/random` | Kutipan motivasi acak |
| JSONPlaceholder | `https://jsonplaceholder.typicode.com/todos?_limit=5` | Data tugas awal (pertama kali) |

> Semua API di atas **gratis** dan **tidak memerlukan API key**.

---

## 🐍 Bonus: Program Segitiga Python (`segitiga.py`)

Program Python terpisah yang mencetak pola segitiga simetris menggunakan karakter `#`.

**Cara menjalankan:**
```bash
python segitiga.py
```

**Contoh output (tinggi = 5):**
```
    #
   ###
  #####
 #######
#########
```

---

## 👤 Informasi

- **Mata Kuliah:** Praktikum Pemrograman Web
- **Kampus:** Institut Teknologi Sumatera (ITERA)
- **Tahun:** 2026
