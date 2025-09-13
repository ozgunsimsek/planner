const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('./auth');

// Öğrenci detay sayfası (ana sayfa)
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        // Session'da öğrenci verisi yoksa oluştur
        if (!req.session.studentData) {
            req.session.studentData = {
                id: req.params.id,
                coach: req.session.userId,
                weeklySchedule: global.schoolDays.map(day => ({
                    day: day,
                    subjects: []
                })),
                weeklyRoutine: ''
            };
        }
        
        res.render('students/detail', { student: req.session.studentData });
    } catch (error) {
        res.redirect('/');
    }
});

// Print template
router.get('/print-template/:id', isAuthenticated, async (req, res) => {
    try {
        // Session'dan öğrenci verisini al
        if (!req.session.studentData) {
            return res.redirect('/');
        }

        const student = req.session.studentData;

        // Tüm dersleri tek bir array'de topla
        const allSubjects = student.weeklySchedule.reduce((acc, schedule) => {
            return [...acc, ...schedule.subjects];
        }, []);

        // Student objesine subjects array'ini ekle
        const studentWithSubjects = {
            ...student,
            subjects: allSubjects
        };

        res.render('print-template', { student: studentWithSubjects });
    } catch (error) {
        res.redirect('/');
    }
});

// Haftalık program güncelleme
router.post('/:id/schedule', isAuthenticated, async (req, res) => {
    try {
        // Session'da öğrenci verisi yoksa oluştur
        if (!req.session.studentData) {
            req.session.studentData = {
                id: req.params.id,
                coach: req.session.userId,
                weeklySchedule: global.schoolDays.map(day => ({
                    day: day,
                    subjects: []
                })),
                weeklyRoutine: ''
            };
        }

        const { subjects } = req.body;
        
        if (!Array.isArray(subjects)) {
            return res.status(400).json({ error: 'Geçersiz veri formatı' });
        }

        // Boş dersleri filtrele
        const filteredSubjects = subjects.filter(subject => 
            subject.subject && subject.subject.trim() !== ''
        );

        // Dersleri günlere sırayla dağıt (sadece ders günleri)
        const weeklySchedule = global.schoolDays.map(day => ({ day, subjects: [] }));
        
        // Her dersi sırayla günlere dağıt
        filteredSubjects.forEach((subject, index) => {
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 = Pazar, 1 = Pazartesi, ... 6 = Cumartesi
            const dateDiff = dayOfWeek; // Bugün hangi günse o günden başlayarak dağıt
            const dayIndex = (index + dateDiff) % global.schoolDays.length; // 0-6 arası döngüsel indeks
            weeklySchedule[dayIndex].subjects.push(subject);
        });

        // Session'daki haftalık programı güncelle
        req.session.studentData.weeklySchedule = weeklySchedule;

        res.json({ success: true });
    } catch (error) {
        console.error('Program güncelleme hatası:', error);
        res.status(500).json({ error: 'Program güncellenirken bir hata oluştu' });
    }
});

// Rutin kaydetme
router.post('/:id/routine', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { routine } = req.body;
        
        // Session'da öğrenci verisi yoksa oluştur
        if (!req.session.studentData) {
            req.session.studentData = {
                id: id,
                coach: req.session.userId,
                weeklySchedule: global.schoolDays.map(day => ({
                    day: day,
                    subjects: []
                })),
                weeklyRoutine: ''
            };
        }
        
        // Session'daki rutini güncelle
        req.session.studentData.weeklyRoutine = routine;
        
        res.json({ success: true });
    } catch (error) {
        console.error('Rutin kaydetme hatası:', error);
        res.status(500).json({ error: 'Rutin kaydedilirken bir hata oluştu' });
    }
});

module.exports = router;