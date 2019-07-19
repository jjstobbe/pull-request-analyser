var github = require('octonode');
var { GITHUB_AUTH_TOKEN } = process.env;
var client = github.client(GITHUB_AUTH_TOKEN);

async function GetPullRequest(pullRequestUrl)
{
    const { domain, repo, pullRequestNumber } = ParsePullRequestUrl(pullRequestUrl);
    
    let pullRequest = []
    try {
        pullRequest = await client
            .pr(`${domain}/${repo}`, pullRequestNumber)
            .infoAsync();
    } catch (e) {
        console.log("Trouble getting pull request", e)
        return;
    }

    if (pullRequest.length != 2)
    {
        console.log("Trouble getting pull request")
        return;
    }

    return pullRequest[0];
}

function ParsePullRequestUrl(pullRequestUrl)
{
    var split = pullRequestUrl.split('/');

    if (split.length != 7)
    {
        console.log("Invalid URL")
        process.exit(1);
    }

    if (split[2] != 'github.com' || split[5] != 'pull')
    {
        console.log("Invalid URL")
        process.exit(1)
    }

    return { domain: split[3], repo: split[4], pullRequestNumber: parseInt(split[6]) }
}

async function GetPullRequestFileNames(pullRequestUrl)
{
    var { domain, repo, pullRequestNumber } = ParsePullRequestUrl(pullRequestUrl);
    var fileObjects = await client
        .pr(`${domain}/${repo}`, pullRequestNumber)
        .filesAsync();
    
    if (!fileObjects || fileObjects.length != 2)
    {
        console.log("Trouble finding file for PR");
        process.exit(1)
    }

    var fileNames = fileObjects[0].map((file) => file.filename);

    return fileNames;
}

module.exports = { GetPullRequest, GetPullRequestFileNames }
