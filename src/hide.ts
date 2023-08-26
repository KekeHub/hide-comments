import { Octokit } from '@octokit/action'
// eslint-disable-next-line import/no-unresolved
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types'
import { paginateRest } from '@octokit/plugin-paginate-rest'
import * as core from '@actions/core'
import { ReportedContentClassifiers } from '@octokit/graphql-schema'

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
   * Classifier to hide the comment as.
   *
   * @see {@link https://docs.github.com/en/graphql/reference/enums#reportedcontentclassifiers}
   */
  classifier: ReportedContentClassifiers

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
  const { author, classifier, issueNumber, owner, repo, token } = args

  const octokit = new MyOctokit({ auth: token })

  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    issue_number: issueNumber,
    owner,
    repo
  })

  const targets = (
    await Promise.all(
      comments.map(async comment => {
        return await core.group(`Comment ID: ${comment.id}`, async () => {
          if (author) {
            core.debug(`Author: ${comment.user?.login}, Target: ${author}`)
            if (comment.user && comment.user.login === author) return comment
            core.debug('Did not match author.')
          }

          core.debug('Did not match any conditions, do not hide this comment')
          return undefined
        })
      })
    )
  ).filter(target => target !== undefined) as Issue[]

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
        mutation(classifier: $classifier, $subjectId: ID!) {
          minimizeComment(input: { classifier: $classifier, subjectId: $subjectId }) {
            clientMutationId
          }
        }
      `,
        {
          classifier,
          subjectId: target.node_id
        }
      )
    })
  )

  return new Result(targets)
}
