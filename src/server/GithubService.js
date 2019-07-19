var git = require('simple-git')
var fs = require('fs')
var { GITHUB_USERNAME, GITHUB_AUTH_TOKEN } = process.env;

const repoDirectory = './repositories';

async function CloneRepository(domain, repo)
{
    if (!fs.existsSync(repoDirectory)){
        fs.mkdirSync(repoDirectory);
    }

    if (fs.existsSync(`${repoDirectory}/${repo}`))
    {
        console.log('Repository already exists, no need to clone');
    }
    else
    {
        console.log(`Cloning repository ${domain}/${repo}..`)
        await git(repoDirectory).silent(false).clone(`https://${GITHUB_USERNAME}:${GITHUB_AUTH_TOKEN}@github.com/${domain}/${repo}`);
    }
}

async function CheckoutBranch(domain, repo, branchName)
{
    await CloneRepository(domain, repo);

    await git(`${repoDirectory}/${repo}`)
        .silent(false)
        .fetch()
        .checkout(branchName)
}

module.exports = { CloneRepository, CheckoutBranch };
