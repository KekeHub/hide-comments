import * as core from '@actions/core'
import * as github from '@actions/github'
import { hide } from './hide'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const author: string | undefined =
      core.getInput('author') === '' ? undefined : core.getInput('author')

    const issueNumber: number =
      core.getInput('number') === ''
        ? github.context.issue.number
        : parseInt(core.getInput('number'))

    const [owner, repo] = core
      .getInput('repository', { required: true })
      .split('/')
    const token: string = core.getInput('token', { required: true })

    await hide({
      author,
      issueNumber,
      owner,
      repo,
      token
    })
  } catch (err) {
    if (err instanceof Error) core.setFailed(err.message)
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
