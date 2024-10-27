require("dotenv").config();
const Mustache = require("mustache");
const fs = require("fs");

async function getGithubStats(username) {
  const token = process.env.GITHUB_TOKEN;
  
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `token ${token}`
  };

  try {
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, { headers });
    const repos = await reposResponse.json();

    if (!Array.isArray(repos)) throw new Error('Invalid response from GitHub API');

    let totalStars = 0;
    let totalCommits = 0;
    const currentDate = new Date();
    const oneYearAgo = new Date(currentDate);
    oneYearAgo.setFullYear(currentDate.getFullYear() - 1);

    for (const repo of repos) {
      totalStars += repo.stargazers_count;

      const commitsResponse = await fetch(
        `https://api.github.com/repos/${username}/${repo.name}/commits?since=${oneYearAgo.toISOString()}&per_page=100`,
        { headers }
      );
      const commits = await commitsResponse.json();
      if (Array.isArray(commits)) totalCommits += commits.length;
    }

    return { totalStars, totalCommits };
  } catch (error) {
    console.error('Error fetching GitHub stats:', error);
    return { totalStars: 0, totalCommits: 0 };
  }
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
  const repoData = await getGithubStats(process.env.GH_USERNAME);
  const totalStars = repoData.totalStars;
  const totalCommitsInPastYear = repoData.totalCommits;

  await updateReadme({ totalStars, totalCommitsInPastYear });
}

main();