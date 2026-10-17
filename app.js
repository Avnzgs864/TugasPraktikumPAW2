class TaskItem {
    constructor(title, type = 'task', extra = {}) {
        this.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        this.title = title;
        this.type = type;
        this.createdAt = new Date().toISOString();

        const {
            description = '', day = '', time = '', room = '',
            priority = 'medium', deadline = '', done = false,
            body = '', sks = 0, nilai = 'A'
        } = extra;

        if (type === 'schedule') {
            this.day = day;
            this.time = time;
            this.room = room;
        } else if (type === 'task') {
            this.description = description;
            this.priority = priority;
            this.deadline = deadline;
            this.done = done;
        } else if (type === 'note') {
            this.body = body;
        } else if (type === 'matkul') {
            this.sks = sks;
            this.nilai = nilai;
        }
    }

    toggleDone() {
        this.done = !this.done;
        return this;
    }
}


class DashboardApp {
    constructor() {
        this.schedules = [];
        this.tasks = [];
        this.notes = [];
        this.matkuls = [];

        this.activeDay = 'Senin';
        this.activeFilter = 'all';
        this.activeSection = 'beranda';
        this.editingItem = null;
        this.modalMode = '';
        this.isDark = true;

        this.pomoState = {
            mode: 'focus',
            durations: { focus: 25 * 60, short: 5 * 60, long: 15 * 60 },
            timeLeft: 25 * 60,
            running: false,
            interval: null,
            sessions: 0
        };

        this.els = {
            scheduleList: document.getElementById('schedule-list'),
            taskList: document.getElementById('task-list'),
            notesList: document.getElementById('notes-list'),
            weatherContent: document.getElementById('weather-content'),
            quoteText: document.getElementById('quote-text'),
            quoteAuthor: document.getElementById('quote-author'),
            quoteTextMini: document.getElementById('quote-text-mini'),
            clockDisplay: document.getElementById('clock-display'),
            greetingText: document.getElementById('greeting-text'),
            greetingDate: document.getElementById('greeting-date'),
            modalOverlay: document.getElementById('modal-overlay'),
            modalTitle: document.getElementById('modal-title'),
            modalForm: document.getElementById('modal-form'),
            toastContainer: document.getElementById('toast-container'),
            progressRingFill: document.getElementById('progress-ring-fill'),
            progressPercent: document.getElementById('progress-percent'),
            jadwalHariIni: document.getElementById('jadwal-hari-ini'),
            ipkList: document.getElementById('ipk-list'),
        };

        this.loadFromStorage();
        this.bindEvents();
        this.renderAll();
        this.startClock();
        this.fetchWeather();
        this.fetchQuote();
        this.loadInitialTasks();
        this.updatePomodoroDisplay();
    }

    saveToStorage() {
        const data = {
            schedules: this.schedules,
            tasks: this.tasks,
            notes: this.notes,
            matkuls: this.matkuls,
            pomoSessions: this.pomoState.sessions,
            isDark: this.isDark,
        };
        localStorage.setItem('iteraStudentHub', JSON.stringify(data));
    }

    loadFromStorage() {
        const raw = localStorage.getItem('iteraStudentHub');
        if (raw) {
            try {
                const { schedules, tasks, notes, matkuls, pomoSessions, isDark } = JSON.parse(raw);
                this.schedules = schedules || [];
                this.tasks = tasks || [];
                this.notes = notes || [];
                this.matkuls = matkuls || [];
                this.pomoState.sessions = pomoSessions || 0;
                if (typeof isDark === 'boolean') this.isDark = isDark;
            } catch (err) {
                console.error('Gagal memuat data:', err);
            }
        }
        this.applyTheme();
    }

    applyTheme() {
        document.body.classList.toggle('light', !this.isDark);
        const btn = document.getElementById('btn-dark-mode');
        btn.innerHTML = this.isDark
            ? `<i data-lucide="sun"></i><span>Mode Terang</span>`
            : `<i data-lucide="moon"></i><span>Mode Gelap</span>`;
        lucide.createIcons();
    }

    bindEvents() {
        document.getElementById('btn-add-schedule').addEventListener('click', () => this.openModal('schedule'));
        document.getElementById('btn-add-task').addEventListener('click', () => this.openModal('task'));
        document.getElementById('btn-add-note').addEventListener('click', () => this.openModal('note'));
        document.getElementById('btn-add-matkul').addEventListener('click', () => this.openModal('matkul'));

        document.getElementById('btn-close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('btn-cancel-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('btn-save-modal').addEventListener('click', () => this.handleSave());

        this.els.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.els.modalOverlay) this.closeModal();
        });

        document.querySelectorAll('.nav-item').forEach((item) => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                item.classList.add('active');
                const section = item.dataset.section;
                this.switchSection(section);
                const sidebar = document.querySelector('.sidebar');
                if (window.innerWidth <= 900) sidebar.classList.remove('open');
            });
        });

        document.querySelectorAll('.day-tab').forEach((tab) => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.activeDay = tab.dataset.day;
                this.renderScheduleList();
            });
        });

        document.querySelectorAll('.filter-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeFilter = btn.dataset.filter;
                this.renderTaskList();
            });
        });

        document.getElementById('btn-clear-done').addEventListener('click', () => {
            const doneCount = this.tasks.filter(t => t.done).length;
            if (doneCount === 0) {
                this.showToast('Tidak ada tugas selesai untuk dihapus', 'info');
                return;
            }
            if (!confirm(`Hapus ${doneCount} tugas yang sudah selesai?`)) return;
            this.tasks = this.tasks.filter(t => !t.done);
            this.saveToStorage();
            this.renderTaskList();
            this.updateStats();
            this.showToast(`${doneCount} tugas selesai berhasil dihapus`, 'success');
        });

        document.getElementById('btn-refresh-weather').addEventListener('click', () => this.fetchWeather());
        document.getElementById('btn-refresh-quote').addEventListener('click', () => this.fetchQuote());

        document.getElementById('btn-dark-mode').addEventListener('click', () => {
            this.isDark = !this.isDark;
            this.applyTheme();
            this.saveToStorage();
            this.showToast(this.isDark ? 'Mode gelap diaktifkan' : 'Mode terang diaktifkan', 'info');
        });

        document.getElementById('btn-hamburger').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('open');
        });

        document.getElementById('btn-pomo-start').addEventListener('click', () => this.pomoStart());
        document.getElementById('btn-pomo-pause').addEventListener('click', () => this.pomoPause());
        document.getElementById('btn-pomo-reset').addEventListener('click', () => this.pomoReset());

        document.querySelectorAll('.pomo-tab').forEach((tab) => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.pomo-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.pomoState.mode = tab.dataset.pomo;
                this.pomoReset();
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    switchSection(name) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`sec-${name}`);
        if (target) target.classList.add('active');
        this.activeSection = name;
    }

    async fetchWeather() {
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=-5.36&longitude=105.31&current_weather=true&hourly=relative_humidity_2m&timezone=Asia%2FJakarta';

        this.els.weatherContent.innerHTML = `<div class="loader"></div><p style="color:var(--text-muted)">Memuat data cuaca...</p>`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            const { temperature, windspeed, weathercode } = data.current_weather;
            const humidity = data.hourly?.relative_humidity_2m?.[0] ?? '-';
            const emoji = this.getWeatherEmoji(weathercode);
            const desc = this.getWeatherDescription(weathercode);

            this.els.weatherContent.innerHTML = `
                <div class="weather-main">
                    <span class="weather-emoji">${emoji}</span>
                    <span class="weather-temp">${Math.round(temperature)}°C</span>
                    <span class="weather-desc">${desc}</span>
                </div>
                <div class="weather-details-grid">
                    <div class="weather-detail-item">💨 Angin <strong>${windspeed} km/j</strong></div>
                    <div class="weather-detail-item">💧 Kelembapan <strong>${humidity}%</strong></div>
                    <div class="weather-detail-item">🌡️ Suhu <strong>${temperature}°C</strong></div>
                    <div class="weather-detail-item">☁️ Kondisi <strong>${desc}</strong></div>
                </div>
            `;
        } catch (error) {
            this.els.weatherContent.innerHTML = `<p style="color:var(--accent-5)">⚠️ Gagal memuat cuaca. Periksa koneksi internet.</p>`;
        }
    }

    async fetchQuote() {
        try {
            const response = await fetch('https://dummyjson.com/quotes/random');
            const { quote, author } = await response.json();

            this.els.quoteText.textContent = `"${quote}"`;
            this.els.quoteAuthor.textContent = `— ${author}`;
            this.els.quoteTextMini.textContent = `"${quote}" — ${author}`;
        } catch (error) {
            this.els.quoteText.textContent = '"Pendidikan adalah senjata paling ampuh untuk mengubah dunia."';
            this.els.quoteAuthor.textContent = '— Nelson Mandela';
            this.els.quoteTextMini.textContent = '"Pendidikan adalah senjata paling ampuh..." — Mandela';
        }
    }

    async loadInitialTasks() {
        if (this.tasks.length > 0) return;

        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');
            const todos = await response.json();

            const newTasks = todos.map(({ title, completed }) => {
                return new TaskItem(title, 'task', {
                    description: 'Tugas contoh dari API',
                    priority: 'medium',
                    done: completed,
                });
            });

            this.tasks = [...this.tasks, ...newTasks];
            this.saveToStorage();
            this.renderTaskList();
            this.updateStats();
            this.showToast('5 tugas contoh berhasil dimuat!', 'info');
        } catch (error) {
            console.error('Gagal memuat tugas awal:', error);
        }
    }

    renderAll() {
        this.renderScheduleList();
        this.renderTaskList();
        this.renderNotesList();
        this.renderIPKList();
        this.updateStats();
        this.renderJadwalHariIni();
    }

    updateStats() {
        document.getElementById('stat-jadwal').textContent = this.schedules.length;
        document.getElementById('stat-tugas').textContent = this.tasks.filter(t => !t.done).length;
        document.getElementById('stat-selesai').textContent = this.tasks.filter(t => t.done).length;
        document.getElementById('stat-catatan').textContent = this.notes.length;

        const total = this.tasks.length;
        const done = this.tasks.filter(t => t.done).length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        const circumference = 2 * Math.PI * 52;
        const offset = circumference - (percent / 100) * circumference;

        this.els.progressRingFill.style.stroke = `var(--accent-3)`;
        this.els.progressRingFill.style.strokeDasharray = circumference;
        this.els.progressRingFill.style.strokeDashoffset = offset;
        this.els.progressPercent.textContent = `${percent}%`;

        document.getElementById('prog-active').textContent = total - done;
        document.getElementById('prog-done').textContent = done;
        document.getElementById('prog-total').textContent = total;
    }

    renderJadwalHariIni = () => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const today = days[new Date().getDay()];
        const filtered = this.schedules.filter(s => s.day === today).sort((a, b) => a.time.localeCompare(b.time));

        if (filtered.length === 0) {
            this.els.jadwalHariIni.innerHTML = `<p class="empty-state-sm">Tidak ada jadwal hari ini 🎉</p>`;
            return;
        }

        this.els.jadwalHariIni.innerHTML = filtered.map(s => `
            <div class="mini-item">
                <span class="mini-time">${s.time}</span>
                <span class="mini-title">${s.title}</span>
                <span class="mini-room">${s.room || '-'}</span>
            </div>
        `).join('');
    }

    renderScheduleList = () => {
        const filtered = this.schedules.filter(s => s.day === this.activeDay);

        if (filtered.length === 0) {
            this.els.scheduleList.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="calendar-x" class="empty-icon"></i>
                    <p>Belum ada jadwal untuk hari ${this.activeDay}</p>
                    <span>Klik tombol "Tambah Jadwal" untuk menambahkan</span>
                </div>`;
            lucide.createIcons();
            return;
        }

        filtered.sort((a, b) => a.time.localeCompare(b.time));

        this.els.scheduleList.innerHTML = filtered.map(item => `
            <div class="list-item" data-id="${item.id}">
                <div class="item-body">
                    <div class="item-title">${item.title}</div>
                    <div class="item-meta">
                        <span>🕐 ${item.time}</span>
                        <span>🏫 ${item.room || 'Belum diisi'}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="item-action-btn" onclick="app.openModal('schedule','${item.id}')" title="Ubah">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button class="item-action-btn danger" onclick="app.deleteItem('schedule','${item.id}')" title="Hapus">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    }

    renderTaskList = () => {
        let filtered = [...this.tasks];

        if (this.activeFilter === 'active') {
            filtered = filtered.filter(t => !t.done);
        } else if (this.activeFilter === 'done') {
            filtered = filtered.filter(t => t.done);
        }

        if (filtered.length === 0) {
            const msg = this.activeFilter === 'done' ? 'Belum ada tugas yang selesai'
                      : this.activeFilter === 'active' ? 'Semua tugas sudah selesai! 🎉'
                      : 'Belum ada tugas';
            this.els.taskList.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="clipboard-list" class="empty-icon"></i>
                    <p>${msg}</p>
                    <span>Klik tombol "Tambah Tugas" untuk menambahkan</span>
                </div>`;
            lucide.createIcons();
            this.updateStats();
            return;
        }

        const priorityOrder = { high: 0, medium: 1, low: 2 };
        filtered.sort((a, b) => {
            if (a.done !== b.done) return a.done ? 1 : -1;
            return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
        });

        this.els.taskList.innerHTML = filtered.map(item => {
            const badgeClass = item.priority === 'high' ? 'badge-high' : item.priority === 'low' ? 'badge-low' : 'badge-medium';
            const badgeLabel = item.priority === 'high' ? 'Tinggi' : item.priority === 'low' ? 'Rendah' : 'Sedang';

            return `
                <div class="list-item ${item.done ? 'done' : ''}" data-id="${item.id}">
                    <div class="item-check ${item.done ? 'checked' : ''}"
                         onclick="app.toggleTask('${item.id}')"
                         title="${item.done ? 'Tandai belum selesai' : 'Tandai selesai'}"></div>
                    <div class="item-body">
                        <div class="item-title">${item.title}</div>
                        <div class="item-meta">
                            ${item.deadline ? `<span>📅 ${this.formatDate(item.deadline)}</span>` : ''}
                            ${item.description ? `<span>${item.description}</span>` : ''}
                        </div>
                    </div>
                    <span class="item-badge ${badgeClass}">${badgeLabel}</span>
                    <div class="item-actions">
                        <button class="item-action-btn" onclick="app.openModal('task','${item.id}')" title="Ubah">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="item-action-btn danger" onclick="app.deleteItem('task','${item.id}')" title="Hapus">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.updateStats();
        lucide.createIcons();
    }

    renderNotesList = () => {
        if (this.notes.length === 0) {
            this.els.notesList.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="file-text" class="empty-icon"></i>
                    <p>Belum ada catatan</p>
                    <span>Klik tombol "Tambah Catatan" untuk menambahkan</span>
                </div>`;
            lucide.createIcons();
            return;
        }

        const colors = ['note-color-1', 'note-color-2', 'note-color-3', 'note-color-4', 'note-color-5', 'note-color-6'];

        this.els.notesList.innerHTML = this.notes.map((note, idx) => `
            <div class="note-card ${colors[idx % colors.length]}" data-id="${note.id}">
                <div class="note-actions">
                    <button class="note-action-btn" onclick="app.openModal('note','${note.id}')" title="Ubah">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button class="note-action-btn" onclick="app.deleteItem('note','${note.id}')" title="Hapus">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
                <div class="note-title">${note.title}</div>
                <div class="note-body">${note.body || ''}</div>
                <div class="note-date">${this.formatDate(note.createdAt)}</div>
            </div>
        `).join('');

        lucide.createIcons();
    }

    renderIPKList = () => {
        if (this.matkuls.length === 0) {
            this.els.ipkList.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="book-open" class="empty-icon"></i>
                    <p>Belum ada mata kuliah</p>
                    <span>Klik "Tambah Mata Kuliah" untuk mulai menghitung IPK</span>
                </div>`;
            lucide.createIcons();
            this.updateIPK();
            return;
        }

        this.els.ipkList.innerHTML = this.matkuls.map(mk => `
            <div class="ipk-item" data-id="${mk.id}">
                <span class="ipk-mk-name">${mk.title}</span>
                <span class="ipk-sks">${mk.sks} SKS</span>
                <span class="ipk-nilai">${mk.nilai}</span>
                <div class="item-actions" style="opacity:1">
                    <button class="item-action-btn" onclick="app.openModal('matkul','${mk.id}')" title="Ubah">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button class="item-action-btn danger" onclick="app.deleteItem('matkul','${mk.id}')" title="Hapus">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');

        lucide.createIcons();
        this.updateIPK();
    }

    updateIPK = () => {
        const nilaiMap = { 'A': 4, 'AB': 3.5, 'B': 3, 'BC': 2.5, 'C': 2, 'D': 1, 'E': 0 };
        let totalBobot = 0;
        let totalSKS = 0;

        this.matkuls.forEach(({ sks, nilai }) => {
            const bobot = nilaiMap[nilai] ?? 0;
            totalBobot += bobot * sks;
            totalSKS += sks;
        });

        const ipk = totalSKS > 0 ? (totalBobot / totalSKS).toFixed(2) : '0.00';

        document.getElementById('ipk-value').textContent = ipk;
        document.getElementById('ipk-total-sks').textContent = totalSKS;
        document.getElementById('ipk-total-mk').textContent = this.matkuls.length;
    }

    openModal(mode, itemId = null) {
        this.modalMode = mode;
        this.editingItem = null;

        if (itemId) {
            const source = mode === 'schedule' ? this.schedules
                         : mode === 'task' ? this.tasks
                         : mode === 'note' ? this.notes
                         : this.matkuls;
            this.editingItem = source.find(i => i.id === itemId) || null;
        }

        const isEdit = this.editingItem !== null;
        const titleMap = {
            schedule: isEdit ? 'Ubah Jadwal Kuliah' : 'Tambah Jadwal Kuliah',
            task: isEdit ? 'Ubah Tugas' : 'Tambah Tugas Baru',
            note: isEdit ? 'Ubah Catatan' : 'Tambah Catatan Baru',
            matkul: isEdit ? 'Ubah Mata Kuliah' : 'Tambah Mata Kuliah',
        };

        this.els.modalTitle.textContent = titleMap[mode];

        if (mode === 'schedule') {
            const item = this.editingItem;
            this.els.modalForm.innerHTML = `
                <div class="form-group">
                    <label for="inp-title">Nama Mata Kuliah</label>
                    <input type="text" id="inp-title" placeholder="Contoh: Pemrograman Web"
                           value="${item?.title || ''}" required>
                </div>
                <div class="form-group">
                    <label for="inp-day">Hari</label>
                    <select id="inp-day">
                        ${['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'].map(d =>
                            `<option value="${d}" ${item?.day === d ? 'selected' : ''}>${d}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="inp-time">Jam Mulai</label>
                    <input type="time" id="inp-time" value="${item?.time || '08:00'}">
                </div>
                <div class="form-group">
                    <label for="inp-room">Ruang Kelas</label>
                    <input type="text" id="inp-room" placeholder="Contoh: GD-410"
                           value="${item?.room || ''}">
                </div>
            `;
        } else if (mode === 'task') {
            const item = this.editingItem;
            this.els.modalForm.innerHTML = `
                <div class="form-group">
                    <label for="inp-title">Judul Tugas</label>
                    <input type="text" id="inp-title" placeholder="Contoh: Laporan Praktikum"
                           value="${item?.title || ''}" required>
                </div>
                <div class="form-group">
                    <label for="inp-desc">Deskripsi</label>
                    <textarea id="inp-desc" placeholder="Deskripsi singkat tugas...">${item?.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="inp-priority">Prioritas</label>
                    <select id="inp-priority">
                        <option value="high" ${item?.priority === 'high' ? 'selected' : ''}>🔴 Tinggi</option>
                        <option value="medium" ${item?.priority === 'medium' || !item ? 'selected' : ''}>🟡 Sedang</option>
                        <option value="low" ${item?.priority === 'low' ? 'selected' : ''}>🟢 Rendah</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="inp-deadline">Batas Waktu</label>
                    <input type="date" id="inp-deadline" value="${item?.deadline || ''}">
                </div>
            `;
        } else if (mode === 'note') {
            const item = this.editingItem;
            this.els.modalForm.innerHTML = `
                <div class="form-group">
                    <label for="inp-title">Judul Catatan</label>
                    <input type="text" id="inp-title" placeholder="Contoh: Rumus Fisika"
                           value="${item?.title || ''}" required>
                </div>
                <div class="form-group">
                    <label for="inp-body">Isi Catatan</label>
                    <textarea id="inp-body" placeholder="Tulis catatan di sini..." rows="5">${item?.body || ''}</textarea>
                </div>
            `;
        } else if (mode === 'matkul') {
            const item = this.editingItem;
            this.els.modalForm.innerHTML = `
                <div class="form-group">
                    <label for="inp-title">Nama Mata Kuliah</label>
                    <input type="text" id="inp-title" placeholder="Contoh: Kalkulus I"
                           value="${item?.title || ''}" required>
                </div>
                <div class="form-group">
                    <label for="inp-sks">Jumlah SKS</label>
                    <input type="number" id="inp-sks" min="1" max="6" value="${item?.sks || 3}">
                </div>
                <div class="form-group">
                    <label for="inp-nilai">Nilai Huruf</label>
                    <select id="inp-nilai">
                        ${['A','AB','B','BC','C','D','E'].map(n =>
                            `<option value="${n}" ${item?.nilai === n ? 'selected' : ''}>${n}</option>`
                        ).join('')}
                    </select>
                </div>
            `;
        }

        this.els.modalOverlay.classList.remove('hidden');
    }

    closeModal() {
        this.els.modalOverlay.classList.add('hidden');
        this.editingItem = null;
        this.modalMode = '';
    }

    handleSave() {
        const title = document.getElementById('inp-title')?.value.trim();
        if (!title) {
            this.showToast('Judul tidak boleh kosong!', 'error');
            return;
        }

        const { modalMode: mode, editingItem } = this;

        if (mode === 'schedule') {
            const day = document.getElementById('inp-day').value;
            const time = document.getElementById('inp-time').value;
            const room = document.getElementById('inp-room').value.trim();

            if (editingItem) {
                const idx = this.schedules.findIndex(s => s.id === editingItem.id);
                this.schedules[idx] = { ...this.schedules[idx], title, day, time, room };
                this.showToast('Jadwal berhasil diperbarui!', 'success');
            } else {
                this.schedules = [...this.schedules, new TaskItem(title, 'schedule', { day, time, room })];
                this.showToast('Jadwal berhasil ditambahkan!', 'success');
            }
            this.renderScheduleList();
            this.renderJadwalHariIni();

        } else if (mode === 'task') {
            const description = document.getElementById('inp-desc').value.trim();
            const priority = document.getElementById('inp-priority').value;
            const deadline = document.getElementById('inp-deadline').value;

            if (editingItem) {
                const idx = this.tasks.findIndex(t => t.id === editingItem.id);
                this.tasks[idx] = { ...this.tasks[idx], title, description, priority, deadline };
                this.showToast('Tugas berhasil diperbarui!', 'success');
            } else {
                this.tasks = [...this.tasks, new TaskItem(title, 'task', { description, priority, deadline })];
                this.showToast('Tugas berhasil ditambahkan!', 'success');
            }
            this.renderTaskList();

        } else if (mode === 'note') {
            const body = document.getElementById('inp-body').value.trim();

            if (editingItem) {
                const idx = this.notes.findIndex(n => n.id === editingItem.id);
                this.notes[idx] = { ...this.notes[idx], title, body };
                this.showToast('Catatan berhasil diperbarui!', 'success');
            } else {
                this.notes = [...this.notes, new TaskItem(title, 'note', { body })];
                this.showToast('Catatan berhasil ditambahkan!', 'success');
            }
            this.renderNotesList();

        } else if (mode === 'matkul') {
            const sks = parseInt(document.getElementById('inp-sks').value) || 3;
            const nilai = document.getElementById('inp-nilai').value;

            if (editingItem) {
                const idx = this.matkuls.findIndex(m => m.id === editingItem.id);
                this.matkuls[idx] = { ...this.matkuls[idx], title, sks, nilai };
                this.showToast('Mata kuliah berhasil diperbarui!', 'success');
            } else {
                this.matkuls = [...this.matkuls, new TaskItem(title, 'matkul', { sks, nilai })];
                this.showToast('Mata kuliah berhasil ditambahkan!', 'success');
            }
            this.renderIPKList();
        }

        this.updateStats();
        this.saveToStorage();
        this.closeModal();
    }

    toggleTask(id) {
        this.tasks = this.tasks.map(t =>
            t.id === id ? { ...t, done: !t.done } : t
        );
        this.saveToStorage();
        this.renderTaskList();
    }

    deleteItem(type, id) {
        if (!confirm('Yakin ingin menghapus item ini?')) return;

        if (type === 'schedule') {
            this.schedules = this.schedules.filter(s => s.id !== id);
            this.renderScheduleList();
            this.renderJadwalHariIni();
        } else if (type === 'task') {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.renderTaskList();
        } else if (type === 'note') {
            this.notes = this.notes.filter(n => n.id !== id);
            this.renderNotesList();
        } else if (type === 'matkul') {
            this.matkuls = this.matkuls.filter(m => m.id !== id);
            this.renderIPKList();
        }

        this.updateStats();
        this.saveToStorage();
        this.showToast('Item berhasil dihapus', 'info');
    }

    pomoStart() {
        if (this.pomoState.running) return;
        this.pomoState.running = true;

        document.getElementById('btn-pomo-start').classList.add('hidden');
        document.getElementById('btn-pomo-pause').classList.remove('hidden');

        this.pomoState.interval = setInterval(() => {
            this.pomoState.timeLeft--;

            if (this.pomoState.timeLeft <= 0) {
                this.pomoPause();
                if (this.pomoState.mode === 'focus') {
                    this.pomoState.sessions++;
                    document.getElementById('pomo-session-count').textContent = this.pomoState.sessions;
                    this.saveToStorage();
                    this.showToast('🍅 Sesi fokus selesai! Waktunya istirahat.', 'success');
                } else {
                    this.showToast('⏰ Istirahat selesai! Ayo fokus lagi.', 'info');
                }
                this.pomoReset();
                return;
            }

            this.updatePomodoroDisplay();
        }, 1000);
    }

    pomoPause() {
        this.pomoState.running = false;
        clearInterval(this.pomoState.interval);

        document.getElementById('btn-pomo-start').classList.remove('hidden');
        document.getElementById('btn-pomo-pause').classList.add('hidden');
    }

    pomoReset() {
        this.pomoPause();
        const { mode, durations } = this.pomoState;
        this.pomoState.timeLeft = durations[mode];
        this.updatePomodoroDisplay();
    }

    updatePomodoroDisplay = () => {
        const { timeLeft, mode, durations } = this.pomoState;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;

        document.getElementById('pomo-minutes').textContent = String(mins).padStart(2, '0');
        document.getElementById('pomo-seconds').textContent = String(secs).padStart(2, '0');
        document.getElementById('pomo-session-count').textContent = this.pomoState.sessions;

        const total = durations[mode];
        const progress = (total - timeLeft) / total;
        const circumference = 2 * Math.PI * 90;
        const offset = circumference * (1 - progress);
        document.getElementById('pomo-ring-fill').style.strokeDasharray = circumference;
        document.getElementById('pomo-ring-fill').style.strokeDashoffset = offset;
    }

    startClock() {
        const update = () => {
            const now = new Date();
            const h = String(now.getHours()).padStart(2, '0');
            const m = String(now.getMinutes()).padStart(2, '0');
            const s = String(now.getSeconds()).padStart(2, '0');
            this.els.clockDisplay.textContent = `${h}:${m}:${s}`;

            const hour = now.getHours();
            let greeting = 'Selamat Malam! 🌙';
            if (hour >= 5 && hour < 12) greeting = 'Selamat Pagi! ☀️';
            else if (hour >= 12 && hour < 15) greeting = 'Selamat Siang! 🌤️';
            else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore! 🌅';

            this.els.greetingText.textContent = greeting;
            this.els.greetingDate.textContent = now.toLocaleDateString('id-ID', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            });
        };

        update();
        setInterval(update, 1000);
    }

    showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        toast.innerHTML = `${icon} ${message}`;
        this.els.toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    getWeatherEmoji(code) {
        const map = {
            0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
            45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 55: '🌧️',
            61: '🌧️', 63: '🌧️', 65: '🌧️', 71: '❄️', 73: '❄️', 75: '❄️',
            80: '🌦️', 81: '🌧️', 82: '⛈️', 95: '⛈️', 96: '⛈️', 99: '⛈️',
        };
        return map[code] || '🌡️';
    }

    getWeatherDescription(code) {
        const map = {
            0: 'Cerah', 1: 'Cerah Sebagian', 2: 'Berawan Sebagian', 3: 'Berawan',
            45: 'Kabut', 48: 'Kabut Beku', 51: 'Gerimis Ringan', 53: 'Gerimis', 55: 'Gerimis Lebat',
            61: 'Hujan Ringan', 63: 'Hujan Sedang', 65: 'Hujan Lebat',
            71: 'Salju Ringan', 73: 'Salju Sedang', 75: 'Salju Lebat',
            80: 'Hujan Ringan', 81: 'Hujan Sedang', 82: 'Hujan Sangat Lebat',
            95: 'Badai Petir', 96: 'Badai Petir + Hujan Es', 99: 'Badai Petir Berat',
        };
        return map[code] || 'Tidak Diketahui';
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    }
}


const app = new DashboardApp();
lucide.createIcons();
