const pool = require('../config/db');

class BackupRepository {
    async getAllBackups() {
        try {
            const { rows } = await pool.query(`
                SELECT id, filename, created_at, size, description 
                FROM test.backups
                ORDER BY created_at DESC
            `);
            return rows;
        } catch (error) {
            console.error('Error fetching backups:', error);
            throw error;
        }
    }

    async createBackupRecord(filename, size, description) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                INSERT INTO test.backups (filename, created_at, size, description)
                VALUES ($1, NOW(), $2, $3)
                RETURNING id, filename, created_at, size, description
            `;

            const { rows } = await client.query(query, [filename, size, description || 'Автоматический бэкап']);

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getBackupById(id) {
        try {
            const { rows } = await pool.query(
                'SELECT id, filename, created_at, size, description FROM test.backups WHERE id = $1',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error fetching backup by ID:', error);
            throw error;
        }
    }

    async deleteBackup(id) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { rows } = await client.query(
                'DELETE FROM test.backups WHERE id = $1 RETURNING filename',
                [id]
            );
            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = new BackupRepository();