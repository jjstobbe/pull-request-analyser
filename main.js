require('dotenv').config()

var PullRequestService =  require('./src/PullRequestService')
var GithubService = require('./src/GithubService')
var CodeAnalysisService = require('./src/CodeAnalysisService')

var arguments = process.argv;
if (arguments.length != 3)
{
    console.log("Please enter a pull request url")
    process.exit(1)
}

(async () => {
    var pullRequestUrl = arguments[2];
    var pullRequest = await PullRequestService.GetPullRequest(pullRequestUrl)
    var fileNames = await PullRequestService.GetPullRequestFileNames(pullRequestUrl);

    var branchName = pullRequest.head.ref;
    var [domain, repo] = pullRequest.head.repo.full_name.split('/');

    await GithubService.CheckoutBranch(domain, repo, branchName)
    await CodeAnalysisService.RunAnalysis(repo, fileNames);
    console.log('done?')
})();
