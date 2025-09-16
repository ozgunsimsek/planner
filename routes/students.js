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

        // Dersleri günlere akıllı dağıt (grup bazlı)
        const schoolDays = global.schoolDays || ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
        const weeklySchedule = schoolDays.map(day => ({ day, subjects: [] }));
        
        // 1. Dersleri groupId bazında grupla
        const subjectGroups = {};
        filteredSubjects.forEach(subject => {
            const groupKey = subject.groupId || 'default';
            if (!subjectGroups[groupKey]) {
                subjectGroups[groupKey] = [];
            }
            subjectGroups[groupKey].push(subject);
        });
        
        
        // 2. Grupları boyutlarına göre sırala (büyükten küçüğe)
        const sortedGroups = Object.values(subjectGroups).sort((a, b) => b.length - a.length);
        
        // 3. Bugünün gününü hesapla (Türkiye saatine göre)
        const today = new Date();
        const turkeyTime = new Date(today.toLocaleString("en-US", {timeZone: "Europe/Istanbul"}));
        const dayOfWeek = turkeyTime.getDay(); // 0 = Pazar, 1 = Pazartesi, ... 6 = Cumartesi
        
        // global.schoolDays: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
        // getDay(): 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
        // Dönüşüm: Pazar=6, Pazartesi=0, Salı=1, ..., Cumartesi=5
        const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        // 4. Her grubu en uygun güne yerleştir
        sortedGroups.forEach(group => {
            const groupSize = group.length;
            
            // Geçerli başlangıç günlerini belirle (döngüsel)
            const validStartDays = [];
            for (let i = 0; i < 7; i++) {
                const dayIndex = (todayIndex + i) % schoolDays.length;
                if (i <= 7 - groupSize) { // Orijinal formül doğru
                    validStartDays.push(dayIndex);
                }
            }
            
            // Geçerli gün yoksa atla
            if (validStartDays.length === 0) {
                return;
            }
            
            // En boş günü bul (eşitlik durumunda bugüne en yakın)
            let bestStartDay = validStartDays[0];
            let minSubjects = weeklySchedule[bestStartDay].subjects.length;
            
            // Döngüsel mesafe hesaplama fonksiyonu
            const getCircularDistance = (day1, day2, totalDays) => {
                const diff = day1 - day2;
                return diff >= 0 ? diff : totalDays + diff;
            };
            
            let minDistance = getCircularDistance(bestStartDay, todayIndex, schoolDays.length);
            
            // Aralıktaki en az dolu günleri bul
            const subjectCounts = validStartDays.map(dayIndex => weeklySchedule[dayIndex].subjects.length);
            const minCount = Math.min(...subjectCounts);
            const minCountDays = validStartDays.filter(dayIndex => weeklySchedule[dayIndex].subjects.length === minCount);
            
            if (minCountDays.length > 1) {
                // Birden fazla en az dolu gün var, haftanın diğer günlerinde daha az dolu olan var mı?
                const otherDays = [];
                for (let i = 0; i < schoolDays.length; i++) {
                    if (!validStartDays.includes(i)) {
                        otherDays.push(i);
                    }
                }
                
                const otherDaysCounts = otherDays.map(dayIndex => weeklySchedule[dayIndex].subjects.length);
                const minOtherCount = Math.min(...otherDaysCounts);
                
                if (minOtherCount < minCount) {
                    // Diğer günlerde daha az dolu olan var, hangi günden başlarsak o güne koyabiliriz?
                    const targetDayIndex = otherDays.find(dayIndex => weeklySchedule[dayIndex].subjects.length === minOtherCount);
                    const candidates = [];
                    
                    minCountDays.forEach(dayIndex => {
                        // Bu günden başlayarak hedef güne kadar sığar mı?
                        const endDay = (dayIndex + groupSize - 1) % schoolDays.length;
                        if (endDay === targetDayIndex) {
                            candidates.push(dayIndex);
                        }
                    });
                    
                    if (candidates.length > 0) {
                        // Hedef güne sığan günlerden bugüne en yakın olanı seç
                        let bestCandidate = candidates[0];
                        let minCandidateDistance = getCircularDistance(candidates[0], todayIndex, schoolDays.length);
                        
                        candidates.forEach(dayIndex => {
                            const distance = getCircularDistance(dayIndex, todayIndex, schoolDays.length);
                            if (distance < minCandidateDistance) {
                                bestCandidate = dayIndex;
                                minCandidateDistance = distance;
                            }
                        });
                        
                        bestStartDay = bestCandidate;
                    } else {
                        // Hedef güne sığan gün yok, normal algoritma
                        bestStartDay = minCountDays[0];
                    }
                } else {
                    // Diğer günlerde daha az dolu olan yok, normal algoritma
                    bestStartDay = minCountDays[0];
                }
            } else {
                // Normal algoritma: En az ders olan günü seç
                validStartDays.forEach(dayIndex => {
                    const currentSubjects = weeklySchedule[dayIndex].subjects.length;
                    const currentDistance = getCircularDistance(dayIndex, todayIndex, schoolDays.length);
                    
                    if (currentSubjects < minSubjects) {
                        minSubjects = currentSubjects;
                        bestStartDay = dayIndex;
                        minDistance = currentDistance;
                    } else if (currentSubjects === minSubjects && currentDistance < minDistance) {
                        bestStartDay = dayIndex;
                        minDistance = currentDistance;
                    }
                });
            }
            
            // Grubu en uygun günden başlayarak yerleştir
            for (let i = 0; i < groupSize; i++) {
                const targetDayIndex = (bestStartDay + i) % schoolDays.length;
                weeklySchedule[targetDayIndex].subjects.push(group[i]);
            }
        });

        // Session'daki haftalık programı güncelle
        req.session.studentData.weeklySchedule = weeklySchedule;

        res.json({ success: true });
    } catch (error) {
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
        res.status(500).json({ error: 'Rutin kaydedilirken bir hata oluştu' });
    }
});

module.exports = router;