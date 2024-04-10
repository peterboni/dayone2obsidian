const fs = require('node:fs');

// Input Day One JSON (.zip) extract folder - SET THIS!
const dayOneFolder = './assets/DayOne/yyyy-M-dd-Journal/';

// Input Day One JSON (.zip) Journal Name - SET THIS!
const dayOneName = 'Journal';

// Input Day One JSON
const dayOneJson = require(`${dayOneFolder}${dayOneName}.json`);

// Output Obsidian Folder
const obsidianFolder = `./assets/Obsidian/${dayOneName}/`;

// Functions

function findObjectByIdentifier(array, targetId) {
    for (let i = 0; i < array.length; i++) {
        if (array[i].identifier === targetId) {
            return array[i];
        }
    }
    return null; // Return null if no matching object is found
}

// Clear Obsidian Folder

fs.rmSync(obsidianFolder, { recursive: true, force: true }, err => {
    if (err) {
        throw err;
    }
    console.log(`${obsidianFolder} is deleted!`);
});

try {
    if (!fs.existsSync(obsidianFolder)) {
        fs.mkdirSync(obsidianFolder);
    }
} catch (err) {
    console.error(err);
}

// DayOne Folders

fs.cpSync(
    dayOneFolder + 'audios/',
    obsidianFolder + 'audios/',
    { recursive: true }
);

fs.cpSync(
    dayOneFolder + 'pdfs/',
    obsidianFolder + 'pdfs/',
    { recursive: true }
);

fs.cpSync(
    dayOneFolder + 'photos/',
    obsidianFolder + 'photos/',
    { recursive: true }
);

// DayOne Entries -> Obsidian Notes

const dayOneEntries = dayOneJson.entries;
for (const entry of dayOneEntries) {

    console.log(`Entry: ${entry.uuid}`);

    const filename = `${obsidianFolder}${entry.creationDate}.md`;

    let contents = '---\n';

    // Identifier
    contents += `uuid: ${entry.uuid}\n`;

    // Tags
    if (entry.tags) {
        contents += `tags:\n`;
        for (const tag of entry.tags) {
            contents += `  - ${tag}\n`;
        }
    }

    // TimeZone
    contents += `timeZone: ${entry.timeZone}\n`;

    // Created
    contents += `creationDate: ${entry.creationDate}\n`;
    contents += `creationDevice: ${entry.creationDevice}\n`;
    contents += `creationDeviceType: ${entry.creationDeviceType}\n`;
    contents += `creationDeviceModel: ${entry.creationDeviceModel}\n`;
    contents += `creationOSName: ${entry.creationOSName}\n`;
    contents += `creationOSVersion: '${entry.creationOSVersion}'\n`;

    // Modified
    contents += `modifiedDate: ${entry.modifiedDate}\n`;

    // User Activity
    if (entry.userActivity?.activityName) {
        contents += `activityName: ${entry.userActivity.activityName}\n`;
    }
    if (entry.userActivity?.stepCount) {
        contents += `stepCount: ${entry.userActivity.stepCount}\n`;
    }

    // Location
    if (entry.location) {

        const locationProps = [
            'administrativeArea',
            'country',
            'latitude',
            'localityName',
            'longitude',
            'placeName',
            'timeZoneName'
        ];

        for (const prop of locationProps) {
            if (entry.location[prop]) contents += `location.${prop}: ${entry.location[prop]}\n`;
        }

        const regionProps = [
            'center.latitude',
            'center.longitude',
            'identifier',
            'radius',
        ];

        for (const prop of regionProps) {
            if (entry.location.region[prop]) {
                contents += `location.region.${prop}: ${entry.location.region[prop]}\n`;
            }
        }
    }

    contents += '---\n';

    // Text

    const textLines = entry.text.split("\n");
    for (let textLine of textLines) {
        if (textLine.startsWith("![]")) {
            let momentFolder;
            let identifier;
            let moment;
            let momentType;
            if (textLine.startsWith("![](dayone-moment:/audio/")) {
                momentFolder = 'audios/';
                identifier = textLine.substring(25, textLine.length - 1);
                moment = findObjectByIdentifier(entry.audios, identifier);
                momentType = moment.format == 'aac' ? 'm4a' : '';
            }
            if (textLine.startsWith("![](dayone-moment:/pdfAttachment/")) {
                momentFolder = 'pdfs/';
                identifier = textLine.substring(33, textLine.length - 1);
                moment = findObjectByIdentifier(entry.pdfAttachments, identifier);
                momentType = moment.type;
            }
            if (textLine.startsWith("![](dayone-moment://")) {
                momentFolder = 'photos/';
                identifier = textLine.substring(20, textLine.length - 1);
                moment = findObjectByIdentifier(entry.photos, identifier);
                momentType = moment.type;
            }
            if (textLine.startsWith("![](dayone-moment:/video/")) {
                momentFolder = 'audios/';
                identifier = textLine.substring(25, textLine.length - 1);
                moment = findObjectByIdentifier(entry.audios, identifier);
                momentType = moment.format == 'mov' ? 'mov' : '';
            }
            if (moment) {
                let momentMd5 = moment.md5;
                textLine = `![[${momentFolder}${momentMd5}.${momentType}]]`;
            }
        }
        contents += textLine.replace(/\\/g, '');
        contents += '\n';
    }

    // Write File

    try {
        fs.writeFileSync(filename, contents);
    } catch (err) {
        console.error(err);
    }
}

console.log(`Total entries: ${dayOneEntries.length}`);
