# Contributing

The purpose of this guide is to document the structure we will use for contributing work to this repository.

## Repo Structure

The repo is structured using the [GitFlow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) workflow.

Here is a summary of the workflow and also our own naming conventions:

#### Base Branches

The repo has two main branches: `master` and `develop`

`master` holds work that is approved and ready for release

`develop` holds work that has been merged in from feature branches and is ready to be tested in a staging environment

#### Feature Branches

Feature branches are branches where developers will do their work. They branch off `develop` always.

##### Feature branch name format

Each feature branch will be named with the corresponding ticket number from JIRA + a brief description of what the feature is: `BW-###-my-branch-name`

Attaching the ticket number helps JIRA recognize to what ticket this work belongs to. The branch and pull request shows up in the JIRA ticket, to help us keep the entire work history tracked in one place.

Example:

For a ticket with a number of BW-345, and a title of "As a user, I'd like to sign in, so I can access additional tools", the branch could be named `BW-345-user-sign-in`

##### Feature branch organization

To help understand if the branch is a bug or a task or a feature, group them into folders by adding a name with a `/` in front of the branch name:

- Bug = `bug/BW-###-my-branch-name`
- Task = `task/BW-###-my-branch-name`
- Feature = `feature/BW-###-my-branch-name`

#### Hotfixes

Hotfixes are bug fixes that need to be immediately made to a release. These fixes should branch off `master` and should be merged into both `master` and `develop` once the fix is ready.

#### Committing work

Make sure each commit is short but describes what was done. Try to avoid vague descriptions. This helps to find commits that caused problems later, if we have a regression of some kind that is causing problems.

#### Workflow Summary

With the structure above in mind, here is the entire development flow in the repo for all users:

1. Developer marks ticket as "in progress"
1. Developer branches off `develop` and names their branch according to the formatting guide above
1. Developer does work in their branch
1. Developer creates a pull request of their work, targeting `develop`, to be reviewed by others
1. Developer makes sure the pull request title has the ticket number at the start: `BW-###`
1. In the pull request description, dev makes note of anything the reviewer must be aware of, for testing or reviewing the work
1. Developer targets the correct branch to merge the PR to (see PR Merge Targets note below)
1. Developer marks ticket as "ready for review"
1. Reviewer will put ticket in "in review", and review using our [PR review doc](https://boomcarding.atlassian.net/wiki/spaces/BW/pages/814940161/PR+Reviews) as reference for what we look for
1. If changes are required, reviewer marks ticket as "declined by qa"
1. Developer will make changes and update the pull request, marking ticket as "ready for review" again
1. Reviewer sets ticket to "in review"
1. Once the work is approved, reviewer will merge the work into `develop` and mark ticket as "ready for internal testing"
1. Once the pull request is approved, it is the responsibility of the reviewer to merge the work
1. `develop` work will be deployed to a QA/staging environment after automation and manual testing

## PR Merge Targets

1. If it's a feature branch, always target `develop` as the merge target
1. If the feature is to be merged into a feature master branch, it should target that branch as the merge target
1. If it's a hotfix, always target `master`
