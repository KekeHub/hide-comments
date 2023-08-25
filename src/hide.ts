import { Octokit } from '@octokit/action'
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types'
import { paginateRest } from '@octokit/plugin-paginate-rest'
import * as core from '@actions/core'

const MyOctokit = Octokit.plugin(paginateRest)
const _octokit = new MyOctokit()

type CreateLabelResponseType = GetResponseDataTypeFromEndpointMethod<
  typeof _octokit.rest.issues.listComments
>

/**
 * Arguments for the hide function.
 */
export interface HideArguments {
  /**
   * Author's login of the GitHub issue or pull request.
   */
  author?: string

  /**
   * Number of the GitHub issue or pull request.
   *
   * @example 1
   */
  issueNumber: number

  /**
   * Owner of the GitHub repository.
   *
   * @example KekeHub
   */
  owner: string

  /**
   * Repository name of the GitHub repository.
   *
   * @example hide-comments
   */
  repo: string

  /**
   * Credentials to authenticate with GitHub.
   */
  token: string
}

/**
 * Result of the hide function.
 */
export class Result {
  constructor(private comments: Issue[]) {}
}

/**
 * Issue or pull request type.
 */
export type Issue = CreateLabelResponseType[number]

/**
 * Hide comments for a specified pull request or issue.
 *
 * @param args Conditions and credentials to hide comments.
 * @returns {Promise<Result>} Resolves with 'done!' after hiding comments.
 */
export async function hide(args: HideArguments): Promise<Result> {
  const { author, issueNumber, owner, repo, token } = args

  const octokit = new MyOctokit({ auth: token })

  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    issue_number: issueNumber,
    owner,
    repo
  })

  const targets = (
    await Promise.all(
      comments.map(async comment => {
        return await core.group(`Comment #${comment.id}`, async () => {
          if (author) {
            core.debug(`Author: ${comment.user?.login}, Target: ${author}`)
            return comment.user && comment.user.login === author
          }

          core.debug('Did not match any conditions, ignore this comment.')
          return false
        })
      })
    )
  ).filter(Boolean)

  core.debug(`Found ${targets.length} comments to hide.`)

  await Promise.all(
    targets.map(async target => {
      /**
       * Minimal GraphQL mutation to hide a GitHub comment.
       *
       * @see {@link https://docs.github.com/en/graphql/reference/mutations#minimizecomment}
       */
      return await octokit.graphql(
        `
        mutation($subjectId: ID!) {
          minimizeComment(input: { subjectId: $subjectId, classifier: OUTDATED }) {
            clientMutationId
          }
        }
      `,
        {
          subjectId: target.node_id
        }
      )
    })
  )

  return new Result(targets)
}
