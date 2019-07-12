const repoDirectory = '.\\repositories';
const resharperDirectoryPath = `${repoDirectory}\\resharperCLT`
const exeFilePath = `${resharperDirectoryPath}\\inspectcode.exe`;

const https = require('follow-redirects').https
const fs = require('fs');
const es = require('event-stream')
const unzip = require('unzip')
const util = require('util')
const exec = require('child_process').exec

const execute = util.promisify(exec)
const readFile = util.promisify(fs.readFile)
const deleteFile = util.promisify(fs.unlink)

async function RunAnalysis(repo, fileNames)
{
    if (!fs.existsSync(exeFilePath)) {
        await downloadResharper();
        await unzipResharper();
    }

    try {
        await deleteFile(`${resharperDirectoryPath}\\analysis-result.xml`);
        await deleteFile(`${resharperDirectoryPath}\\trimmed-analysis-result.xml`);
        await deleteFile(`${resharperDirectoryPath}\\final-analysis-result.xml`);
    } catch (e) { }

    console.log("Running Code Analysis")
    await execute(`${exeFilePath} ${repoDirectory}\\${repo}\\${repo}.sln --output=${resharperDirectoryPath}\\analysis-result.xml`);
    
    await trimXMLResult(fileNames);
    await sortXMLResult();
}


async function downloadResharper() {
    console.log("Downloading resharper..")

    const file = fs.createWriteStream(`${resharperDirectoryPath}.zip`)

    return new Promise((resolve, reject) => {
        https.get("https://download.jetbrains.com/resharper/ReSharperUltimate.2019.1.3/JetBrains.ReSharper.CommandLineTools.2019.1.3.zip", (response) => {
            var stream = response.pipe(file);

            stream.on('error', () => {
                console.log("Trouble downloading resharper")
                process.exit(1);
            })

            stream.on('close', () => {
                resolve()
            })
        })
    })
}

async function unzipResharper() {
    console.log("Unzipping resharper..")

    return new Promise((resolve, reject) => {
        var stream = fs.createReadStream(`${resharperDirectoryPath}.zip`)
            .pipe(unzip.Extract({ path: resharperDirectoryPath }));

        stream.on('error', () => {
            console.log("Trouble unziping resharper")
            process.exit(1);
        })

        stream.on('close', () => {
            resolve();
        })
    })
}

async function trimXMLResult(fileNames) {
    console.log("Trimming result..")

    const sanitizedFileNames = fileNames.map(name => name.replace("/","\\"));
    const outputStream = fs.createWriteStream(`${resharperDirectoryPath}\\trimmed-analysis-result.xml`, { flags:'a' })

    return new Promise((resolve, reject) => {
        var stream = fs.createReadStream(`${resharperDirectoryPath}\\analysis-result.xml`)
            .pipe(es.split())
            .pipe(es.mapSync((line) => {
                var doesMatch = sanitizedFileNames.some(name => line.indexOf(name) != -1)

                if (doesMatch) {
                    outputStream.write(line + "\n")
                }
            }));
        
        stream.on('error', () => {
            console.log("Trouble trimming the result of resharper")
            process.exit(1);
        })

        stream.on('close', () => {
            resolve();
        });
    })
}

async function sortXMLResult() {
    console.log("Sorting result..")

    const outputStream = fs.createWriteStream(`${resharperDirectoryPath}\\final-analysis-result.xml`, { flags:'a' })

    var unsortedFile = (await readFile(`${resharperDirectoryPath}\\trimmed-analysis-result.xml`))
        .toString('utf-8')
        .split("\n")

    unsortedFile.sort((lineA, lineB) => {
        const fileNameA = lineA.substring(lineA.indexOf("File=\"") + 6, lineA.indexOf("Offset=") - 2)
        const fileNameB = lineB.substring(lineB.indexOf("File=\"") + 6, lineB.indexOf("Offset=") - 2)

        const nameComparison = fileNameA.localeCompare(fileNameB)

        if (nameComparison != 0) {
            return nameComparison
        }
        
        const lineNumberA = parseInt(lineA.substring(lineA.indexOf("Line=\"") + 6, lineA.indexOf("Message=") - 2))
        const lineNumberB = parseInt(lineB.substring(lineB.indexOf("Line=\"") + 6, lineB.indexOf("Message=") - 2))

        return lineNumberA - lineNumberB;
    })

    unsortedFile.forEach((line) => {
        outputStream.write(line + "\n")
    })
}

module.exports = { RunAnalysis }
