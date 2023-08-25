# Hide Comments Action

[![GitHub Super-Linter](https://github.com/KekeHub/hide-comments/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/KekeHub/hide-comments/actions/workflows/ci.yml/badge.svg)

🎭 GitHub Actions to hide comments on a PR that match specific conditions 🎭

This action extract the number from an issue or a pull request which has triggered this by default. You don't need to specify the issue number by `${{ github.event.issue.number }}` or `${{ github.event.pull_request.number }}` if you want to post to its issue or pull request.

## Usage

```yaml
- name: Hide GitHub Actions' comments
  uses: KekeHub/hide-comments@v1
  with:
    author: ${{ github.actor }}
```

## Inputs

| Name | Description | Default |
| --- | --- | --- |
| `author` | The author of comments to hide. | - |
| `number` | Number of issue or pull request to hide comments. | `{{ github.event.issue.number }}` or `${{ github.event.pull_request.number }}` |
| `repository` | Repository name. | `${{ github.repository }}` |
| `token` | GitHub token. | `${{ github.token }}` |

## Outputs

Nothing.

## Accessing in other repositories

You can close issues in another repository by using a [PAT](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) or [GitHub Apps](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps#about-github-apps)(recommended) instead of `GITHUB_TOKEN`.

## License

This action is licensed under the terms of the [MIT](./LICENSE).
