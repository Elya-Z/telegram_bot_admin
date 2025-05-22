const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const pool = require('../config/db');
const backupRepository = require('../repositories/backupRepository');
const backupDir = path.join(__dirname, '../../backups');

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

class BackupController {
    async getBackups(req, res) {
        try {
            const backups = await backupRepository.getAllBackups();
            res.json(backups);
        } catch (error) {
            console.error('Ошибка загрузки бэкапов:', error);
            res.status(500).json({ error: 'Не удалось загрузить бэкапы' });
        }
    }

    async createBackup(req, res) {
        const { description } = req.body;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.sql`;
        const filePath = path.join(backupDir, filename);
        const { DB_USER, DB_PASSWORD, DB_HOST, DB_NAME } = process.env;

        try {
            fs.writeFileSync(filePath, '');

            const pgDump = spawn('pg_dump', [
                '-U', DB_USER,
                '-h', DB_HOST,
                '-d', DB_NAME,
                '-n', 'test',
                '-f', filePath
            ], {
                env: { ...process.env, PGPASSWORD: DB_PASSWORD }
            });
            const exitCode = await new Promise((resolve, reject) => {
                pgDump.on('close', (code) => {
                    if (code === 0) resolve(code);
                    else reject(new Error(`pg_dump exited with code ${code}`));
                });
                pgDump.on('error', reject);
            });

            const stats = fs.statSync(filePath);
            if (stats.size === 0) {
                throw new Error('Created backup file is empty');
            }

            const backup = await backupRepository.createBackupRecord(
                filename,
                stats.size,
                description || 'Automatic backup'
            );

            return res.json({
                success: true,
                backup,
                message: 'Backup created successfully'
            });

        } catch (error) {
            console.error('Backup creation error:', error);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

    }

    async downloadBackup(req, res) {
        try {
            const { filename } = req.params;
            if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                return res.status(400).json({ error: 'Недопустимое имя файла' });
            }

            const filePath = path.join(backupDir, filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'Файл не найден' });
            }

            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.setHeader('Content-Type', 'application/octet-stream');
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        } catch (error) {
            console.error('Error downloading backup:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async deleteBackup(req, res) {
        const { id } = req.params;
        try {
            const selectQuery = 'SELECT filename FROM test.backups WHERE id = $1';
            const selectResult = await pool.query(selectQuery, [id]);

            if (selectResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Бэкап не найден'
                });
            }

            const { filename } = selectResult.rows[0];
            const filePath = path.join(backupDir, filename);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            const deleteQuery = 'DELETE FROM test.backups WHERE id = $1';
            await pool.query(deleteQuery, [id]);

            res.json({
                success: true,
                message: 'Бэкап успешно удален'
            });
        } catch (error) {
            console.error('Error deleting backup:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new BackupController();