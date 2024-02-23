const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const rename = promisify(fs.rename);

async function findDuplicateImages(folder) {
    const files = await readdir(folder);
    const hashDict = {};

    for (const filename of files) {
        const filepath = path.join(folder, filename);
        const stats = await stat(filepath);

        if (stats.isFile()) {
            const fileContent = await readFile(filepath);
            const fileHash = crypto.createHash('md5').update(fileContent).digest('hex');

            if (hashDict[fileHash]) {
                hashDict[fileHash].push(filepath);
            } else {
                hashDict[fileHash] = [filepath];
            }
        }
    }

    return hashDict;
}

async function moveDuplicateImages(folder, destinationFolder) {
    const hashDict = await findDuplicateImages(folder);

    for (const hashKey in hashDict) {
        if (hashDict[hashKey].length > 1) {
            for (let i = 1; i < hashDict[hashKey].length; i++) {
                console.log("Moving:", hashDict[hashKey][i]);
                const filename = path.basename(hashDict[hashKey][i]);
                await rename(hashDict[hashKey][i], path.join(destinationFolder, filename));
            }
        }
    }
}

async function main() {
    const folderPath = "./foto";
    const destinationPath = "./same";
    if (!fs.existsSync(destinationPath)) {
        fs.mkdirSync(destinationPath, { recursive: true });
    }
    await moveDuplicateImages(folderPath, destinationPath);
    console.log("Operation completed.");
}

function getInput(question) {
    return new Promise((resolve) => {
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        readline.question(question, (answer) => {
            resolve(answer);
            readline.close();
        });
    });
}

main().catch(console.error);
