#!/usr/bin/env node

const fs = require('fs');

// Components that need translations at root level
const componentsToFix = [
    'AppointmentManagement',
    'AssignmentManager',
    'TutorAnalytics',
    'StudentSummaryList',
    'PaymentManager',
    'NotificationManager',
    'NotificationPreferencesManager'
];

function fixTranslations(locale) {
    const filename = `messages/${locale}.json`;
    const data = JSON.parse(fs.readFileSync(filename, 'utf8'));

    let fixed = 0;

    componentsToFix.forEach(component => {
        // Check if already at root
        if (data[component]) {
            console.log(`✓ ${component} already at root level`);
            return;
        }

        // Check in TutorDashboard
        if (data.TutorDashboard?.[component]) {
            data[component] = data.TutorDashboard[component];
            console.log(`✅ Copied ${component} from TutorDashboard to root`);
            fixed++;
            return;
        }

        // Check in StudentDashboard
        if (data.StudentDashboard?.[component]) {
            data[component] = data.StudentDashboard[component];
            console.log(`✅ Copied ${component} from StudentDashboard to root`);
            fixed++;
            return;
        }

        console.log(`⚠️  ${component} not found`);
    });

    if (fixed > 0) {
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        console.log(`\n📝 Fixed ${fixed} components in ${filename}`);
    } else {
        console.log(`\n✓ No fixes needed for ${filename}`);
    }

    return fixed;
}

console.log('🔧 Fixing translation structure...\n');
console.log('English (en.json):');
const enFixed = fixTranslations('en');
console.log('\nChinese (zh.json):');
const zhFixed = fixTranslations('zh');

console.log(`\n✅ Total fixes: ${enFixed + zhFixed}`);
