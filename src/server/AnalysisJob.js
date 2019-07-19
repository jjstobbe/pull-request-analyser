require('dotenv').config()

var PullRequestService =  require('./PullRequestService')
var GithubService = require('./GithubService')
var CodeAnalysisService = require('./CodeAnalysisService')

// If the file is called directly with the PR as an argument
if (typeof require != 'undefined' && require.main==module) {
    var arguments = process.argv;
    if (arguments.length != 3)
    {
        console.error("Please enter a pull request url")
        process.exit(1)
    }

    (async () => {
        await RunAnalysisJob(arguments[2]);
    })();
}

RunAnalysisJob = async (pullRequestUrl) => {
    var pullRequest = await PullRequestService.GetPullRequest(pullRequestUrl)
    var fileNames = await PullRequestService.GetPullRequestFileNames(pullRequestUrl);

    var branchName = pullRequest.head.ref;
    var [domain, repo] = pullRequest.head.repo.full_name.split('/');

    await GithubService.CheckoutBranch(domain, repo, branchName)
    return await CodeAnalysisService.RunAnalysis(repo, fileNames);
}

module.exports = { RunAnalysisJob }
