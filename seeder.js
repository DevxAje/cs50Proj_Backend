require('dotenv').config();
const supabase = require('./src/config/database');

const exercises = [
    // PUSH PRIMARY (10)
    { name: 'Barbell Bench Press', category: 'push', type: 'primary' },
    { name: 'Incline Barbell Bench Press', category: 'push', type: 'primary' },
    { name: 'Dumbbell Bench Press', category: 'push', type: 'primary' },
    { name: 'Incline Dumbbell Press', category: 'push', type: 'primary' },
    { name: 'Machine Chest Press', category: 'push', type: 'primary' },
    { name: 'Smith Machine Bench Press', category: 'push', type: 'primary' },
    { name: 'Decline Barbell Bench Press', category: 'push', type: 'primary' },
    { name: 'Close-Grip Barbell Bench Press', category: 'push', type: 'primary' },
    { name: 'Swiss Bar Bench Press', category: 'push', type: 'primary' },
    { name: 'Hammer Strength Chest Press', category: 'push', type: 'primary' },

    // PUSH ACCESSORY (5)
    { name: 'Dumbbell Flye', category: 'push', type: 'accessory' },
    { name: 'Machine Flye', category: 'push', type: 'accessory' },
    { name: 'Triceps Pushdown', category: 'push', type: 'accessory' },
    { name: 'Overhead Triceps Extension', category: 'push', type: 'accessory' },
    { name: 'Dips', category: 'push', type: 'accessory' },

    // PULL PRIMARY (6)
    { name: 'Barbell Deadlift', category: 'pull', type: 'primary' },
    { name: 'Barbell Bent Over Row', category: 'pull', type: 'primary' },
    { name: 'Weighted Pull-ups', category: 'pull', type: 'primary' },
    { name: 'Machine Row', category: 'pull', type: 'primary' },
    { name: 'Seal Rows', category: 'pull', type: 'primary' },
    { name: 'T-Bar Row', category: 'pull', type: 'primary' },

    // PULL ACCESSORY (10)
    { name: 'Lat Pulldown', category: 'pull', type: 'accessory' },
    { name: 'Assisted Pull-ups', category: 'pull', type: 'accessory' },
    { name: 'Chest Supported Row', category: 'pull', type: 'accessory' },
    { name: 'Dumbbell Row', category: 'pull', type: 'accessory' },
    { name: 'Cable Row', category: 'pull', type: 'accessory' },
    { name: 'Machine Lat Pulldown', category: 'pull', type: 'accessory' },
    { name: 'Inverted Row', category: 'pull', type: 'accessory' },
    { name: 'Face Pulls', category: 'pull', type: 'accessory' },
    { name: 'Shrugs', category: 'pull', type: 'accessory' },
    { name: 'Barbell Curls', category: 'pull', type: 'accessory' },

    // LEGS PRIMARY (3)
    { name: 'Barbell Back Squat', category: 'legs', type: 'primary' },
    { name: 'Barbell Leg Press', category: 'legs', type: 'primary' },
    { name: 'Barbell Romanian Deadlift', category: 'legs', type: 'primary' },

    // LEGS ACCESSORY (11)
    { name: 'Leg Curl', category: 'legs', type: 'accessory' },
    { name: 'Leg Extension', category: 'legs', type: 'accessory' },
    { name: 'Smith Machine Squat', category: 'legs', type: 'accessory' },
    { name: 'Hack Squat', category: 'legs', type: 'accessory' },
    { name: 'Machine Leg Press', category: 'legs', type: 'accessory' },
    { name: 'Walking Lunges', category: 'legs', type: 'accessory' },
    { name: 'Calf Raises', category: 'legs', type: 'accessory' },
    { name: 'Goblet Squats', category: 'legs', type: 'accessory' },
    { name: 'Leg Press Machine', category: 'legs', type: 'accessory' },
    { name: 'Lying Leg Curl', category: 'legs', type: 'accessory' },
    { name: 'Seated Leg Curl', category: 'legs', type: 'accessory' }
];

async function seedExercises() {
    try {
        // Clear existing (optional)
        // await supabase.from('exercises').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        const { error } = await supabase.from('exercises').insert(exercises);

        if (error) {
            console.error('❌ Seed error:', error.message);
            return;
        }

        console.log(`✅ ${exercises.length} Exercises seeded!`);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

seedExercises();
