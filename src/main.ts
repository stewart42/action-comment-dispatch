import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'

async function run(): Promise<void> {
  try {
    core.startGroup('Validating')

    if (context.eventName !== 'issue_comment') {
      core.debug(`event triggered ${context.eventName}`)
      core.setFailed('Event for workflow is not "issue_comment"')
      return
    }

    const token = core.getInput('GITHUB_TOKEN', {required: true})
    const prefix = core.getInput('prefix', {required: true})
    const trigger = core.getInput('trigger', {required: true})
    const eventType = core.getInput('event_type', {required: true})

    const {owner, repo} = context.repo
    core.debug(`owner: ${owner} repo: ${repo}`)

    const octokit = getOctokit(token)

    const {
      data: {pull_request}
    } = await octokit.issues.get({
      owner,
      repo,
      issue_number: context.issue.number
    })

    if (!pull_request) {
      core.info('Comment is not on a Pull Request, exiting.')
      core.endGroup()
      return
    }
    core.info(`Comment is on a Pull Request`)

    const comment: {id: number | undefined; body: string | undefined} = {
      id: context.payload.comment?.id,
      body: context.payload.comment?.body
    }

    if (!comment.id) {
      core.info('No comment found')
      core.endGroup()
      return
    }

    if (!comment.body || !comment.body.trim().startsWith(prefix)) {
      core.info(`Prefix doesn't match, exiting.`)
      core.endGroup()
      return
    }
    core.info(`Prefix matches beginning of comment`)

    if (!comment.body.trim().includes(trigger)) {
      core.info(`Trigger not found in comment, exiting.`)
      core.endGroup()
      return
    }
    core.info(`Trigger found in comment.`)

    core.endGroup()

    core.startGroup('Running')

    await octokit.reactions.createForIssueComment({
      owner,
      repo,
      comment_id: comment.id,
      content: 'eyes'
    })
    core.info('Added :eyes: reaction to comment.')

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

    core.info(
      `Retrieved PR sha: ${clientPayload.head_sha} and ref: ${clientPayload.head_ref}`
    )

    await octokit.repos.createDispatchEvent({
      owner,
      repo,
      event_type: eventType,
      client_payload: clientPayload
    })

    core.info(`Created Repository Dispatch with type: ${eventType}`)

    await octokit.reactions.createForIssueComment({
      owner,
      repo,
      comment_id: comment.id,
      content: 'rocket'
    })
    core.info('Added :rocket: reaction to comment.')
    core.endGroup()
  } catch (error) {
    core.debug(error)
    core.setFailed(error.message)
  }
}

run()
