const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    weeklySchedule: [{
        day: {
            type: String,
            enum: global.schoolDays || ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
            required: true
        },
        subjects: [{
            subject: String,
            notes: String
        }]
    }],
    weeklyRoutine: {
        type: String,
        default: ''
    },
    coach: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coach',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);