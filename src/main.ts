import core from '@actions/core'
import {context, getOctokit} from '@actions/github'

async function run(): Promise<void> {
  try {
    if (context.eventName !== 'issue_comment') {
      core.setFailed('Event is not "issue_comment"')
      return
    }

    const token = core.getInput('GITHUB_TOKEN', {required: true})

    if (!token) {
      core.setFailed('If "reaction" is supplied, GITHUB_TOKEN is required')
      return
    }

    const {owner, repo} = context.repo
    const octokit = getOctokit(token)

    const {
      data: {pull_request}
    } = await octokit.issues.get({
      owner,
      repo,
      issue_number: context.issue.number
    })

    if (!pull_request) {
      core.setFailed('Comment is not on a Pull Request')
      return
    }

    const {comment} = context.payload || {
      comment: {
        id: undefined,
        body: ''
      }
    }

    if (comment && comment.id) {
      await octokit.reactions.createForIssueComment({
        owner,
        repo,
        comment_id: comment.id,
        content: 'eyes'
      })
    }

    const {
      repository: {
        pullRequest: {baseRef, headRef}
      }
    } = await octokit.graphql(
      `
          query pullRequestDetails($repo:String!, $owner:String!, $number:Int!) {
            repository(name: $repo, owner: $owner) {
              pullRequest(number: $number) {
                baseRef {
                  name
                  target {
                    oid
                  }
                }
                headRef {
                  name
                  target {
                    oid
                  }
                }
              }
            }
          }
        `,
      {
        owner,
        repo,
        number: context.issue.number
      }
    )

    const clientPayload = {
      base_ref: baseRef.name,
      base_sha: baseRef.target.oid,
      head_ref: headRef.name,
      head_sha: headRef.target.oid
    }

    const eventType = core.getInput('event-type')

    await octokit.repos.createDispatchEvent({
      owner,
      repo,
      event_type: eventType,
      client_payload: clientPayload
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
