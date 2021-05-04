# Action Comment Dispatch

## Usage

Action inputs

| Name           | Description                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN` | A `repo` scoped GitHub [Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token). |
| `prefix`       | Comment must start with this value, eg: @bot                                                                                                 |
| `trigger`      | The text in the comment to trigger the repository dispatch, eg deploy                                                                        |
| `event_type`   | The custom event_type to send with when triggering the repository dispatch                                                                   |

```yaml
- uses: stewart42/action-comment-dispatch@main
  with:
    GITHUB_TOKEN: ${{ secrets.REPO_ACCESS_TOKEN }}
    prefix: 'bot'
    trigger: 'format'
    event_type: 'format'
```

### `GITHUB_TOKEN`

This action creates [`repository_dispatch`](https://developer.github.com/v3/repos/#create-a-repository-dispatch-event) events.
The default `GITHUB_TOKEN` does not have scopes to do this so a `repo` scoped [PAT](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) created on a user with `write` access to the target repository is required. If you will be dispatching to a public repository then you can use the more limited `public_repo` scope.

## Developer setup

Install the dependencies

```sh
npm install
```

Build the typescript and package it for distribution

```sh
npm run build && npm run package
```

Run the tests :heavy_check_mark:

```sh
npm test

 PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)

...
```

See the [toolkit documentation](https://github.com/actions/toolkit/blob/master/README.md#packages) for the various packages.

## Publish to a distribution branch

Actions are run from GitHub repos so we will checkin the packed dist folder.

Then run [ncc](https://github.com/zeit/ncc) and push the results:

```bash
npm run package
git add dist
git commit -a -m "prod dependencies"
git push origin releases/v1
```

Your action is now published! :rocket:

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

## Validate & Testing

You can now validate the action by referencing `./` in a workflow in your repo (see [test.yml](.github/workflows/comment-bot.yml))

```yaml
uses: ./
with:
  GITHUB_TOKEN: ${{ secrets.REPO_ACCESS_TOKEN }}
  prefix: 'bot'
  trigger: 'format'
  event_type: 'format'
```

See the [actions tab](https://github.com/actions/typescript-action/actions) for runs of this action! :rocket:
