// Form gönderiminden önce haftalık program verilerini düzenleme
document.addEventListener('DOMContentLoaded', function() {
    const scheduleForm = document.getElementById('scheduleForm');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Her gün için subjects dizisini düzenle
            const weeklySchedule = global.days.map((day, dayIndex) => {
                const subjects = [];
                const container = document.getElementById(`subjects-${day}`);
                const entries = container.getElementsByClassName('subject-entry');
                
                Array.from(entries).forEach((entry, index) => {
                    const inputs = entry.getElementsByTagName('input');
                    subjects.push({
                        subject: inputs[0].value,
                        notes: inputs[1].value
                    });
                });
                
                return {
                    day: day,
                    subjects: subjects
                };
            });
            
            // Form verilerini güncelle
            const formData = new FormData(scheduleForm);
            formData.set('weeklySchedule', JSON.stringify(weeklySchedule));
            
            // Formu gönder
            fetch(scheduleForm.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Object.fromEntries(formData))
            })
            .then(response => {
                if (response.ok) {
                    window.location.reload();
                } else {
                    throw new Error('Program güncellenirken bir hata oluştu');
                }
            })
            .catch(error => {
                alert(error.message);
            });
        });
    }
}); 