/* ==========================================================================
   PERPUSTAKAAN SD - FRONTEND JAVASCRIPT LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Current Active Tab
    let activeSection = 'dashboard';
    
    // Slide State
    let currentSlide = 1;
    const totalSlides = 3;

    // Elements Initialization
    initLiveDate();
    initNavigation();
    initSlideshow();
    initToast();

    // Load initial dashboard statistics
    loadDashboardStats();
    loadRecentTransactions();

    // Event Listeners for CRUD Sections loading
    document.getElementById('nav-dashboard').addEventListener('click', () => {
        loadDashboardStats();
        loadRecentTransactions();
    });
    document.getElementById('nav-member').addEventListener('click', loadMembers);
    document.getElementById('nav-buku').addEventListener('click', loadBuku);
    document.getElementById('nav-transaksi').addEventListener('click', loadPeminjaman);

    // ==========================================================================
    // 1. LIVE DATE DISPLAY
    // ==========================================================================
    function initLiveDate() {
        const liveDateEl = document.getElementById('live-date');
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        
        const now = new Date();
        const dayName = days[now.getDay()];
        const dayNum = now.getDate();
        const monthName = months[now.getMonth()];
        const year = now.getFullYear();
        
        if (liveDateEl) {
            liveDateEl.textContent = `${dayName}, ${dayNum} ${monthName} ${year}`;
        }
    }

    // ==========================================================================
    // 2. TABS & NAVIGATION CONTROL
    // ==========================================================================
    function initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.content-section');
        const pageTitle = document.getElementById('page-title');
        const pageSubtitle = document.getElementById('page-subtitle');

        const titleMap = {
            'dashboard': { title: 'Dashboard Utama', subtitle: 'Ringkasan statistik dan aktivitas perpustakaan' },
            'slideshow': { title: 'Presentasi Kasus & ERD', subtitle: 'Materi presentasi studi kasus, skema ERD, dan alur program' },
            'member': { title: 'Kelola Anggota', subtitle: 'Manajemen data anggota (Member) perpustakaan' },
            'buku': { title: 'Katalog Buku', subtitle: 'Manajemen data katalog buku perpustakaan' },
            'transaksi': { title: 'Transaksi Peminjaman', subtitle: 'Proses peminjaman dan pengembalian buku' }
        };

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('data-target');
                
                // Set active link
                navLinks.forEach(nl => nl.classList.remove('active'));
                link.classList.add('active');

                // Set active section
                sections.forEach(sec => sec.classList.remove('active'));
                const targetSec = document.getElementById(`sec-${target}`);
                if (targetSec) {
                    targetSec.classList.add('active');
                }

                // Update Header
                if (titleMap[target]) {
                    pageTitle.textContent = titleMap[target].title;
                    pageSubtitle.textContent = titleMap[target].subtitle;
                }

                activeSection = target;
            });
        });
    }

    // ==========================================================================
    // 3. PREMIUM SLIDESHOW SYSTEM
    // ==========================================================================
    function initSlideshow() {
        const btnPrev = document.getElementById('btn-slide-prev');
        const btnNext = document.getElementById('btn-slide-next');
        const indicators = document.querySelectorAll('.slide-indicators .indicator');
        const slides = document.querySelectorAll('.slides-container .slide');

        function updateSlides() {
            slides.forEach(slide => {
                slide.classList.remove('active', 'prev-out');
                const slideIdx = parseInt(slide.getAttribute('data-index'));
                if (slideIdx === currentSlide) {
                    slide.classList.add('active');
                } else if (slideIdx < currentSlide) {
                    slide.classList.add('prev-out');
                }
            });

            // Update Indicators
            indicators.forEach(ind => {
                const indIdx = parseInt(ind.getAttribute('data-target'));
                if (indIdx === currentSlide) {
                    ind.classList.add('active');
                } else {
                    ind.classList.remove('active');
                }
            });

            // Enable/disable buttons
            btnPrev.disabled = currentSlide === 1;
            btnNext.disabled = currentSlide === totalSlides;
        }

        btnPrev.addEventListener('click', () => {
            if (currentSlide > 1) {
                currentSlide--;
                updateSlides();
            }
        });

        btnNext.addEventListener('click', () => {
            if (currentSlide < totalSlides) {
                currentSlide++;
                updateSlides();
            }
        });

        indicators.forEach(ind => {
            ind.addEventListener('click', () => {
                currentSlide = parseInt(ind.getAttribute('data-target'));
                updateSlides();
            });
        });

        // Initialize state
        updateSlides();
    }

    // ==========================================================================
    // 4. TOAST NOTIFICATION SYSTEM
    // ==========================================================================
    function initToast() {
        window.showToast = function(message, type = 'success') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
            toast.innerHTML = `
                <i class="fa-solid ${icon}"></i>
                <div class="toast-message">${message}</div>
            `;

            container.appendChild(toast);

            // Auto remove toast
            setTimeout(() => {
                toast.style.animation = 'fadeOut 0.3s ease-out forwards';
                toast.addEventListener('animationend', () => {
                    toast.remove();
                });
            }, 4000);
        };
    }

    // ==========================================================================
    // 5. API UTILITIES
    // ==========================================================================
    async function apiRequest(url, options = {}) {
        try {
            const defaultHeaders = {
                'Content-Type': 'application/json'
            };
            options.headers = { ...defaultHeaders, ...options.headers };

            const response = await fetch(url, options);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Terjadi kesalahan sistem.');
            }
            return data;
        } catch (error) {
            console.error('API Error:', error);
            showToast(error.message, 'error');
            throw error;
        }
    }

    // Get today's date in YYYY-MM-DD
    function getTodayDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // ==========================================================================
    // 6. DASHBOARD & STATS LOGIC
    // ==========================================================================
    async function loadDashboardStats() {
        try {
            const stats = await apiRequest('/api/stats');
            document.getElementById('stat-total-buku').textContent = stats.total_buku;
            document.getElementById('stat-total-member').textContent = stats.total_member;
            document.getElementById('stat-total-dipinjam').textContent = stats.total_dipinjam;
            document.getElementById('db-status-badge').className = 'status-badge connected';
            document.getElementById('db-status-badge').innerHTML = '<i class="fa-solid fa-circle-check"></i> Terhubung';
        } catch (err) {
            document.getElementById('db-status-badge').className = 'status-badge disconnected';
            document.getElementById('db-status-badge').innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Terputus';
        }
    }

    async function loadRecentTransactions() {
        const tblBody = document.querySelector('#tbl-recent-transactions tbody');
        try {
            const data = await apiRequest('/api/peminjaman');
            tblBody.innerHTML = '';
            
            if (data.length === 0) {
                tblBody.innerHTML = '<tr><td colspan="4" class="text-center">Belum ada transaksi peminjaman.</td></tr>';
                return;
            }

            // Show first 5 items
            const limit = Math.min(data.length, 5);
            for (let i = 0; i < limit; i++) {
                const tr = data[i];
                const statusBadge = tr.status === 'Dipinjam' 
                    ? '<span class="badge warning">Dipinjam</span>' 
                    : '<span class="badge success">Dikembalikan</span>';

                tblBody.innerHTML += `
                    <tr>
                        <td><strong>${tr.nama_member}</strong></td>
                        <td>${tr.judul_buku}</td>
                        <td>${tr.tgl_pinjam}</td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
            }
        } catch (err) {
            tblBody.innerHTML = '<tr><td colspan="4" class="text-center">Gagal memuat aktivitas transaksi terbaru.</td></tr>';
        }
    }

    // ==========================================================================
    // 7. MEMBER CRUD LOGIC
    // ==========================================================================
    const modalMember = document.getElementById('modal-member');
    const formMember = document.getElementById('form-member');
    
    document.getElementById('btn-add-member').addEventListener('click', () => {
        document.getElementById('member-modal-title').textContent = 'Tambah Anggota';
        document.getElementById('member-id').value = '';
        formMember.reset();
        modalMember.classList.add('active');
    });

    document.getElementById('btn-close-member-modal').addEventListener('click', closeModalMember);
    document.getElementById('btn-cancel-member').addEventListener('click', closeModalMember);

    function closeModalMember() {
        modalMember.classList.remove('active');
    }

    formMember.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('member-id').value;
        const nama = document.getElementById('member-nama').value;
        const email = document.getElementById('member-email').value;

        const payload = { nama, email };

        try {
            if (id) {
                // Update
                await apiRequest(`/api/member/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                showToast('Data Anggota berhasil diperbarui!');
            } else {
                // Insert
                await apiRequest('/api/member', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                showToast('Anggota baru berhasil didaftarkan!');
            }
            closeModalMember();
            loadMembers();
        } catch (err) {
            // Error is handled in apiRequest
        }
    });

    async function loadMembers() {
        const tblBody = document.querySelector('#tbl-members tbody');
        tblBody.innerHTML = '<tr><td colspan="4" class="text-center">Memuat data...</td></tr>';
        
        try {
            const data = await apiRequest('/api/member');
            tblBody.innerHTML = '';
            
            if (data.length === 0) {
                tblBody.innerHTML = '<tr><td colspan="4" class="text-center">Belum ada anggota perpustakaan.</td></tr>';
                return;
            }

            data.forEach(m => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${m.id_member}</td>
                    <td><strong>${m.nama}</strong></td>
                    <td>${m.email}</td>
                    <td class="actions-cell">
                        <button class="btn btn-secondary btn-action btn-edit" data-id="${m.id_member}" data-nama="${m.nama}" data-email="${m.email}">
                            <i class="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-action btn-delete" data-id="${m.id_member}">
                            <i class="fa-solid fa-trash-can"></i> Hapus
                        </button>
                    </td>
                `;
                tblBody.appendChild(tr);
            });

            // Attach Edit & Delete Listeners
            tblBody.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const nama = btn.getAttribute('data-nama');
                    const email = btn.getAttribute('data-email');

                    document.getElementById('member-modal-title').textContent = 'Edit Data Anggota';
                    document.getElementById('member-id').value = id;
                    document.getElementById('member-nama').value = nama;
                    document.getElementById('member-email').value = email;
                    modalMember.classList.add('active');
                });
            });

            tblBody.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    if (confirm('Apakah Anda yakin ingin menghapus anggota ini? Seluruh transaksi terkait akan ikut terhapus.')) {
                        try {
                            await apiRequest(`/api/member/${id}`, { method: 'DELETE' });
                            showToast('Anggota berhasil dihapus.');
                            loadMembers();
                        } catch (err) {}
                    }
                });
            });
        } catch (err) {
            tblBody.innerHTML = '<tr><td colspan="4" class="text-center">Gagal mengambil data dari server.</td></tr>';
        }
    }

    // ==========================================================================
    // 8. BUKU CRUD LOGIC
    // ==========================================================================
    const modalBuku = document.getElementById('modal-buku');
    const formBuku = document.getElementById('form-buku');

    document.getElementById('btn-add-buku').addEventListener('click', () => {
        document.getElementById('buku-modal-title').textContent = 'Tambah Buku';
        document.getElementById('buku-id').value = '';
        formBuku.reset();
        modalBuku.classList.add('active');
    });

    document.getElementById('btn-close-buku-modal').addEventListener('click', closeModalBuku);
    document.getElementById('btn-cancel-buku').addEventListener('click', closeModalBuku);

    function closeModalBuku() {
        modalBuku.classList.remove('active');
    }

    formBuku.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('buku-id').value;
        const judul = document.getElementById('buku-judul').value;
        const penulis = document.getElementById('buku-penulis').value;

        const payload = { judul, penulis };

        try {
            if (id) {
                await apiRequest(`/api/buku/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                showToast('Buku berhasil diperbarui!');
            } else {
                await apiRequest('/api/buku', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                showToast('Buku baru berhasil didaftarkan!');
            }
            closeModalBuku();
            loadBuku();
        } catch (err) {}
    });

    async function loadBuku() {
        const tblBody = document.querySelector('#tbl-buku tbody');
        tblBody.innerHTML = '<tr><td colspan="4" class="text-center">Memuat data...</td></tr>';

        try {
            const data = await apiRequest('/api/buku');
            tblBody.innerHTML = '';

            if (data.length === 0) {
                tblBody.innerHTML = '<tr><td colspan="4" class="text-center">Belum ada katalog buku.</td></tr>';
                return;
            }

            data.forEach(b => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${b.id_buku}</td>
                    <td><strong>${b.judul}</strong></td>
                    <td>${b.penulis || '-'}</td>
                    <td class="actions-cell">
                        <button class="btn btn-secondary btn-action btn-edit" data-id="${b.id_buku}" data-judul="${b.judul}" data-penulis="${b.penulis}">
                            <i class="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-action btn-delete" data-id="${b.id_buku}">
                            <i class="fa-solid fa-trash-can"></i> Hapus
                        </button>
                    </td>
                `;
                tblBody.appendChild(tr);
            });

            tblBody.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const judul = btn.getAttribute('data-judul');
                    const penulis = btn.getAttribute('data-penulis');

                    document.getElementById('buku-modal-title').textContent = 'Edit Data Buku';
                    document.getElementById('buku-id').value = id;
                    document.getElementById('buku-judul').value = judul;
                    document.getElementById('buku-penulis').value = penulis === 'null' ? '' : penulis;
                    modalBuku.classList.add('active');
                });
            });

            tblBody.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    if (confirm('Apakah Anda yakin ingin menghapus buku ini? Seluruh riwayat transaksi terkait akan terhapus.')) {
                        try {
                            await apiRequest(`/api/buku/${id}`, { method: 'DELETE' });
                            showToast('Buku berhasil dihapus.');
                            loadBuku();
                        } catch (err) {}
                    }
                });
            });
        } catch (err) {
            tblBody.innerHTML = '<tr><td colspan="4" class="text-center">Gagal mengambil data dari server.</td></tr>';
        }
    }

    // ==========================================================================
    // 9. TRANSACTION (PEMINJAMAN & PENGEMBALIAN) CRUD LOGIC
    // ==========================================================================
    const modalTransaksi = document.getElementById('modal-transaksi');
    const formTransaksi = document.getElementById('form-transaksi');
    const modalKembalikan = document.getElementById('modal-kembalikan');
    const formKembalikan = document.getElementById('form-kembalikan');

    document.getElementById('btn-add-transaksi').addEventListener('click', async () => {
        document.getElementById('transaksi-modal-title').textContent = 'Catat Transaksi Peminjaman';
        document.getElementById('transaksi-id').value = '';
        document.getElementById('edit-transaksi-fields').style.display = 'none';
        
        // Reset form and set default date
        formTransaksi.reset();
        document.getElementById('transaksi-tgl-pinjam').value = getTodayDateString();

        // Load dropdown options dynamically
        const ok = await populateDropdowns();
        if (ok) {
            modalTransaksi.classList.add('active');
        }
    });

    document.getElementById('btn-close-transaksi-modal').addEventListener('click', closeModalTransaksi);
    document.getElementById('btn-cancel-transaksi').addEventListener('click', closeModalTransaksi);

    function closeModalTransaksi() {
        modalTransaksi.classList.remove('active');
    }

    document.getElementById('btn-close-kembalikan-modal').addEventListener('click', closeModalKembalikan);
    document.getElementById('btn-cancel-kembalikan').addEventListener('click', closeModalKembalikan);

    function closeModalKembalikan() {
        modalKembalikan.classList.remove('active');
    }

    async function populateDropdowns(selectedMemberId = '', selectedBukuId = '') {
        const selMember = document.getElementById('transaksi-member');
        const selBuku = document.getElementById('transaksi-buku');

        try {
            // Load members
            const members = await apiRequest('/api/member');
            selMember.innerHTML = '<option value="">-- Pilih Anggota --</option>';
            members.forEach(m => {
                const selected = m.id_member == selectedMemberId ? 'selected' : '';
                selMember.innerHTML += `<option value="${m.id_member}" ${selected}>${m.nama} (${m.email})</option>`;
            });

            // Load books
            const books = await apiRequest('/api/buku');
            selBuku.innerHTML = '<option value="">-- Pilih Buku --</option>';
            books.forEach(b => {
                const selected = b.id_buku == selectedBukuId ? 'selected' : '';
                selBuku.innerHTML += `<option value="${b.id_buku}" ${selected}>${b.judul} ${b.penulis ? ' - ' + b.penulis : ''}</option>`;
            });

            if (members.length === 0) {
                showToast('Daftarkan anggota terlebih dahulu sebelum mencatat transaksi.', 'error');
                return false;
            }
            if (books.length === 0) {
                showToast('Tambahkan katalog buku terlebih dahulu sebelum mencatat transaksi.', 'error');
                return false;
            }
            return true;
        } catch (err) {
            return false;
        }
    }

    // Submit Pinjam / Update Pinjam Form
    formTransaksi.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('transaksi-id').value;
        const id_member = document.getElementById('transaksi-member').value;
        const id_buku = document.getElementById('transaksi-buku').value;
        const tgl_pinjam = document.getElementById('transaksi-tgl-pinjam').value;

        const payload = { id_member, id_buku, tgl_pinjam };

        try {
            if (id) {
                // Modifikasi data peminjaman (Edit)
                payload.status = document.getElementById('transaksi-status').value;
                payload.tgl_kembali = document.getElementById('transaksi-tgl-kembali').value || null;
                
                await apiRequest(`/api/peminjaman/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                showToast('Data Transaksi berhasil diperbarui!');
            } else {
                // Catat transaksi baru (Insert)
                await apiRequest('/api/peminjaman', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                showToast('Peminjaman berhasil dicatat!');
            }
            closeModalTransaksi();
            loadPeminjaman();
        } catch (err) {}
    });

    // Quick Return Form Submit
    formKembalikan.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('kembalikan-id').value;
        const tgl_kembali = document.getElementById('kembalikan-tgl').value;

        try {
            await apiRequest(`/api/peminjaman/${id}/kembalikan`, {
                method: 'POST',
                body: JSON.stringify({ tgl_kembali })
            });
            showToast('Buku berhasil dikembalikan!');
            closeModalKembalikan();
            loadPeminjaman();
        } catch (err) {}
    });

    async function loadPeminjaman() {
        const tblBody = document.querySelector('#tbl-transaksi tbody');
        tblBody.innerHTML = '<tr><td colspan="7" class="text-center">Memuat data...</td></tr>';

        try {
            const data = await apiRequest('/api/peminjaman');
            tblBody.innerHTML = '';

            if (data.length === 0) {
                tblBody.innerHTML = '<tr><td colspan="7" class="text-center">Belum ada transaksi peminjaman.</td></tr>';
                return;
            }

            data.forEach(t => {
                const isDipinjam = t.status === 'Dipinjam';
                const statusBadge = isDipinjam 
                    ? '<span class="badge warning">Dipinjam</span>' 
                    : '<span class="badge success">Dikembalikan</span>';

                const actionButtons = isDipinjam 
                    ? `<button class="btn btn-success btn-action btn-return" data-id="${t.id_pinjam}">
                            <i class="fa-solid fa-arrow-rotate-left"></i> Kembalikan
                       </button>`
                    : '';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${t.id_pinjam}</td>
                    <td><strong>${t.nama_member}</strong><br><small style="color:var(--text-secondary)">${t.email_member}</small></td>
                    <td><strong>${t.judul_buku}</strong><br><small style="color:var(--text-secondary)">${t.penulis_buku || '-'}</small></td>
                    <td>${t.tgl_pinjam}</td>
                    <td>${statusBadge}</td>
                    <td>${t.tgl_kembali || '-'}</td>
                    <td class="actions-cell">
                        ${actionButtons}
                        <button class="btn btn-secondary btn-action btn-edit-tx" 
                                data-id="${t.id_pinjam}" data-member="${t.id_member}" 
                                data-buku="${t.id_buku}" data-pinjam="${t.tgl_pinjam}" 
                                data-status="${t.status}" data-kembali="${t.tgl_kembali || ''}">
                            <i class="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-action btn-delete-tx" data-id="${t.id_pinjam}">
                            <i class="fa-solid fa-trash-can"></i> Hapus
                        </button>
                    </td>
                `;
                tblBody.appendChild(tr);
            });

            // Quick Return click listener
            tblBody.querySelectorAll('.btn-return').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    document.getElementById('kembalikan-id').value = id;
                    document.getElementById('kembalikan-tgl').value = getTodayDateString();
                    modalKembalikan.classList.add('active');
                });
            });

            // Edit Transaction click listener
            tblBody.querySelectorAll('.btn-edit-tx').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    const memberId = btn.getAttribute('data-member');
                    const bukuId = btn.getAttribute('data-buku');
                    const tglPinjam = btn.getAttribute('data-pinjam');
                    const status = btn.getAttribute('data-status');
                    const tglKembali = btn.getAttribute('data-kembali');

                    document.getElementById('transaksi-modal-title').textContent = 'Edit Transaksi Peminjaman';
                    document.getElementById('transaksi-id').value = id;
                    document.getElementById('transaksi-tgl-pinjam').value = tglPinjam;
                    document.getElementById('transaksi-status').value = status;
                    document.getElementById('transaksi-tgl-kembali').value = tglKembali;
                    
                    document.getElementById('edit-transaksi-fields').style.display = 'block';

                    // Populate selects and set active options
                    const ok = await populateDropdowns(memberId, bukuId);
                    if (ok) {
                        modalTransaksi.classList.add('active');
                    }
                });
            });

            // Delete Transaction click listener
            tblBody.querySelectorAll('.btn-delete-tx').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    if (confirm('Apakah Anda yakin ingin menghapus catatan transaksi peminjaman ini?')) {
                        try {
                            await apiRequest(`/api/peminjaman/${id}`, { method: 'DELETE' });
                            showToast('Catatan transaksi berhasil dihapus.');
                            loadPeminjaman();
                        } catch (err) {}
                    }
                });
            });
        } catch (err) {
            tblBody.innerHTML = '<tr><td colspan="7" class="text-center">Gagal mengambil data dari server.</td></tr>';
        }
    }
});
