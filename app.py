from flask import Flask, jsonify, request, render_template
import mysql.connector
from mysql.connector import Error
import os

app = Flask(__name__)

# Konfigurasi Koneksi MySQL
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': ''  # Default password XAMPP kosong
}
DB_NAME = 'perpustakaan_sd'

def get_db_connection(include_db=True):
    """Mendapatkan koneksi ke MySQL server."""
    config = DB_CONFIG.copy()
    if include_db:
        config['database'] = DB_NAME
    return mysql.connector.connect(**config)

def init_db():
    """Menginisialisasi database dan tabel jika belum ada."""
    try:
        # Koneksi awal tanpa memilih database untuk membuat database jika belum ada
        conn = get_db_connection(include_db=False)
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        cursor.close()
        conn.close()

        # Koneksi dengan database terpilih untuk membuat tabel-tabelnya
        conn = get_db_connection(include_db=True)
        cursor = conn.cursor()

        # Buat tabel member
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS member (
                id_member INT AUTO_INCREMENT PRIMARY KEY,
                nama VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL
            ) ENGINE=InnoDB
        """)

        # Buat tabel buku
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS buku (
                id_buku INT AUTO_INCREMENT PRIMARY KEY,
                judul VARCHAR(255) NOT NULL,
                penulis VARCHAR(255)
            ) ENGINE=InnoDB
        """)

        # Buat tabel peminjaman (Tabel Transaksi Hubungan Many-to-Many)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS peminjaman (
                id_pinjam INT AUTO_INCREMENT PRIMARY KEY,
                id_member INT NOT NULL,
                id_buku INT NOT NULL,
                tgl_pinjam VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'Dipinjam',
                tgl_kembali VARCHAR(50) NULL,
                FOREIGN KEY (id_member) REFERENCES member(id_member) ON DELETE CASCADE,
                FOREIGN KEY (id_buku) REFERENCES buku(id_buku) ON DELETE CASCADE
            ) ENGINE=InnoDB
        """)

        # Memasukkan data awal (seed) jika tabel kosong agar aplikasi langsung ada datanya saat didemo
        cursor.execute("SELECT COUNT(*) FROM member")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO member (nama, email) VALUES (%s, %s)", ("Budi Santoso", "budi@gmail.com"))
            cursor.execute("INSERT INTO member (nama, email) VALUES (%s, %s)", ("Siti Aminah", "siti@gmail.com"))
            cursor.execute("INSERT INTO member (nama, email) VALUES (%s, %s)", ("Rian Hidayat", "rian@gmail.com"))

        cursor.execute("SELECT COUNT(*) FROM buku")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO buku (judul, penulis) VALUES (%s, %s)", ("Laskar Pelangi", "Andrea Hirata"))
            cursor.execute("INSERT INTO buku (judul, penulis) VALUES (%s, %s)", ("Bumi", "Tere Liye"))
            cursor.execute("INSERT INTO buku (judul, penulis) VALUES (%s, %s)", ("Matematika Kelas 4", "Kementerian Pendidikan"))

        cursor.execute("SELECT COUNT(*) FROM peminjaman")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO peminjaman (id_member, id_buku, tgl_pinjam, status) VALUES (1, 1, '2026-05-20', 'Dipinjam')")
            cursor.execute("INSERT INTO peminjaman (id_member, id_buku, tgl_pinjam, status, tgl_kembali) VALUES (2, 2, '2026-05-18', 'Dikembalikan', '2026-05-24')")

        conn.commit()
        cursor.close()
        conn.close()
        print("Database dan tabel berhasil diinisialisasi.")
    except Error as e:
        print(f"Gagal menginisialisasi database: {e}")

# Inisialisasi DB saat aplikasi dijalankan
init_db()

# --- ROUTES ---

@app.route('/')
def index():
    return render_template('index.html')

# --- API STATS ---
@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT COUNT(*) as count FROM member")
        total_member = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM buku")
        total_buku = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM peminjaman WHERE status = 'Dipinjam'")
        total_dipinjam = cursor.fetchone()['count']
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'total_member': total_member,
            'total_buku': total_buku,
            'total_dipinjam': total_dipinjam
        })
    except Error as e:
        return jsonify({'error': str(e)}), 500

# --- CRUD MEMBER ---

@app.route('/api/member', methods=['GET'])
def get_members():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM member ORDER BY id_member DESC")
        members = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(members)
    except Error as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/member', methods=['POST'])
def add_member():
    data = request.json
    if not data or 'nama' not in data or 'email' not in data:
        return jsonify({'error': 'Nama dan Email harus diisi!'}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO member (nama, email) VALUES (%s, %s)", (data['nama'], data['email']))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({'message': 'Member berhasil ditambahkan!', 'id_member': new_id}), 201
    except Error as e:
        if "Duplicate entry" in str(e):
            return jsonify({'error': 'Email sudah terdaftar!'}), 400
        return jsonify({'error': str(e)}), 500

@app.route('/api/member/<int:id>', methods=['PUT'])
def update_member(id):
    data = request.json
    if not data or 'nama' not in data or 'email' not in data:
        return jsonify({'error': 'Nama dan Email harus diisi!'}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE member SET nama = %s, email = %s WHERE id_member = %s", (data['nama'], data['email'], id))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Member berhasil diubah!'})
    except Error as e:
        if "Duplicate entry" in str(e):
            return jsonify({'error': 'Email sudah digunakan oleh member lain!'}), 400
        return jsonify({'error': str(e)}), 500

@app.route('/api/member/<int:id>', methods=['DELETE'])
def delete_member(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM member WHERE id_member = %s", (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Member berhasil dihapus!'})
    except Error as e:
        return jsonify({'error': str(e)}), 500

# --- CRUD BUKU ---

@app.route('/api/buku', methods=['GET'])
def get_buku():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM buku ORDER BY id_buku DESC")
        books = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(books)
    except Error as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/buku', methods=['POST'])
def add_buku():
    data = request.json
    if not data or 'judul' not in data:
        return jsonify({'error': 'Judul buku harus diisi!'}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO buku (judul, penulis) VALUES (%s, %s)", (data['judul'], data.get('penulis', '')))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({'message': 'Buku berhasil ditambahkan!', 'id_buku': new_id}), 201
    except Error as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/buku/<int:id>', methods=['PUT'])
def update_buku(id):
    data = request.json
    if not data or 'judul' not in data:
        return jsonify({'error': 'Judul buku harus diisi!'}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE buku SET judul = %s, penulis = %s WHERE id_buku = %s", (data['judul'], data.get('penulis', ''), id))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Buku berhasil diubah!'})
    except Error as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/buku/<int:id>', methods=['DELETE'])
def delete_buku(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM buku WHERE id_buku = %s", (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Buku berhasil dihapus!'})
    except Error as e:
        return jsonify({'error': str(e)}), 500

# --- CRUD PEMINJAMAN ---

@app.route('/api/peminjaman', methods=['GET'])
def get_peminjaman():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # Melakukan join untuk mengambil detail Nama Member dan Judul Buku
        query = """
            SELECT p.id_pinjam, p.id_member, p.id_buku, p.tgl_pinjam, p.status, p.tgl_kembali,
                   m.nama as nama_member, m.email as email_member,
                   b.judul as judul_buku, b.penulis as penulis_buku
            FROM peminjaman p
            JOIN member m ON p.id_member = m.id_member
            JOIN buku b ON p.id_buku = b.id_buku
            ORDER BY p.id_pinjam DESC
        """
        cursor.execute(query)
        borrows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(borrows)
    except Error as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/peminjaman', methods=['POST'])
def add_peminjaman():
    data = request.json
    if not data or 'id_member' not in data or 'id_buku' not in data or 'tgl_pinjam' not in data:
        return jsonify({'error': 'Member, Buku, dan Tanggal Pinjam harus diisi!'}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Periksa apakah member & buku valid
        cursor.execute("SELECT id_member FROM member WHERE id_member = %s", (data['id_member'],))
        if not cursor.fetchone():
            return jsonify({'error': 'Member tidak valid!'}), 400
            
        cursor.execute("SELECT id_buku FROM buku WHERE id_buku = %s", (data['id_buku'],))
        if not cursor.fetchone():
            return jsonify({'error': 'Buku tidak valid!'}), 400

        # Tambah data peminjaman
        cursor.execute(
            "INSERT INTO peminjaman (id_member, id_buku, tgl_pinjam, status) VALUES (%s, %s, %s, 'Dipinjam')",
            (data['id_member'], data['id_buku'], data['tgl_pinjam'])
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({'message': 'Transaksi peminjaman berhasil dicatat!', 'id_pinjam': new_id}), 201
    except Error as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/peminjaman/<int:id>', methods=['PUT'])
def update_peminjaman(id):
    data = request.json
    if not data or 'id_member' not in data or 'id_buku' not in data or 'tgl_pinjam' not in data or 'status' not in data:
        return jsonify({'error': 'Semua data peminjaman wajib diisi!'}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Periksa validitas
        cursor.execute("SELECT id_member FROM member WHERE id_member = %s", (data['id_member'],))
        if not cursor.fetchone():
            return jsonify({'error': 'Member tidak valid!'}), 400
            
        cursor.execute("SELECT id_buku FROM buku WHERE id_buku = %s", (data['id_buku'],))
        if not cursor.fetchone():
            return jsonify({'error': 'Buku tidak valid!'}), 400

        tgl_kembali = data.get('tgl_kembali')
        cursor.execute(
            "UPDATE peminjaman SET id_member = %s, id_buku = %s, tgl_pinjam = %s, status = %s, tgl_kembali = %s WHERE id_pinjam = %s",
            (data['id_member'], data['id_buku'], data['tgl_pinjam'], data['status'], tgl_kembali, id)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Transaksi peminjaman berhasil diperbarui!'})
    except Error as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/peminjaman/<int:id>/kembalikan', methods=['POST'])
def return_book(id):
    data = request.json or {}
    tgl_kembali = data.get('tgl_kembali')
    if not tgl_kembali:
        return jsonify({'error': 'Tanggal pengembalian harus diisi!'}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Periksa apakah transaksi peminjaman ada
        cursor.execute("SELECT status FROM peminjaman WHERE id_pinjam = %s", (id,))
        res = cursor.fetchone()
        if not res:
            return jsonify({'error': 'Transaksi peminjaman tidak ditemukan!'}), 404
        
        # Update status dan tgl_kembali
        cursor.execute(
            "UPDATE peminjaman SET status = 'Dikembalikan', tgl_kembali = %s WHERE id_pinjam = %s",
            (tgl_kembali, id)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Buku berhasil dikembalikan!'})
    except Error as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/peminjaman/<int:id>', methods=['DELETE'])
def delete_peminjaman(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM peminjaman WHERE id_pinjam = %s", (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Transaksi peminjaman berhasil dihapus!'})
    except Error as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Pastikan direktori templates & static ada
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static', exist_ok=True)
    app.run(host='0.0.0.0', port=5000, debug=True)
