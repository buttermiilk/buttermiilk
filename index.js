require("dotenv").config();
const Mustache = require("mustache");
const fs = require("fs");
const { userInfoFetcher, totalCommitsFetcher } = require("./fetch");
const { Octokit } = require("@octokit/rest");

const countAllCommits = true;

const octokit = new Octokit({
  auth: process.env.GH_ACCESS_TOKEN,
  userAgent: "readme v1.0.0",
  baseUrl: "https://api.github.com",
  log: {
    warn: console.warn,
    error: console.error,
  },
});

async function getStats() {
  const stats = {
    name: '',
    totalPRs: 0,
    totalCommits: 0,
    totalIssues: 0,
    totalStars: 0,
    contributedTo: 0,
  };

  const user = await userInfoFetcher(process.env.GH_ACCESS_TOKEN).then((res) => res.data.data.viewer);

  stats.name = user.name || user.login;
  stats.totalPRs = user.pullRequests.totalCount;
  stats.totalIssues = user.issues.totalCount;
  stats.contributedTo = user.repositoriesContributedTo.totalCount;
  stats.totalStars = user.repositories.nodes.reduce((prev, curr) => {
    return prev + curr.stargazers.totalCount;
  }, 0);

  stats.totalCommits = user.contributionsCollection.totalCommitContributions;
  if (countAllCommits) {
    stats.totalCommits = await totalCommitsFetcher(user.login, process.env.GH_ACCESS_TOKEN);
  }

  return stats;
}

async function updateReadme(userData) {
  const TEMPLATE_PATH = "./main.mustache";
  await fs.readFile(TEMPLATE_PATH, (err, data) => {
    if (err) {
      throw err;
    }

    const output = Mustache.render(data.toString(), userData);
    fs.writeFileSync("README.md", output);
  });
}

async function main() {
  const repoData = await getStats();

  const totalStars = repoData.totalStars;
  const lastYear = new Date();
  lastYear.setFullYear(lastYear.getFullYear() - 1);
  const totalCommitsInPastYear = repoData.totalCommits;

  await updateReadme({ totalStars, totalCommitsInPastYear });
}

main();
