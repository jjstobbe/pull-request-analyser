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
    return await sortXMLResult();
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

    const sanitizedFileNames = fileNames.map(name => name.replace(/\//g, "\\"));
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

    unsortedFile = unsortedFile.map(line => {
        return {
            'fileName': line.substring(line.indexOf("File=\"") + 6, line.indexOf("Offset=") - 2),
            'message': line.substring(line.indexOf("Message=\"") + 9, line.indexOf("/>") - 2),
            'lineNumber': parseInt(line.substring(line.indexOf("Line=\"") + 6, line.indexOf("Message=") - 2)),
        }
    }).filter(line => line.message != "" && line.lineNumber != null)

    unsortedFile.sort((lineA, lineB) => {
        const fileNameA = lineA.fileName
        const fileNameB = lineB.fileName

        const nameComparison = fileNameA.localeCompare(fileNameB)

        if (nameComparison != 0) {
            return nameComparison
        }
        
        const lineNumberA = lineA.lineNumber
        const lineNumberB = lineA.lineNumber

        return lineNumberA - lineNumberB;
    })

    unsortedFile.forEach((line) => {
        outputStream.write(line + "\n")
    })

    return unsortedFile;
}

module.exports = { RunAnalysis }
