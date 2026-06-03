---
title: "GitHub Pages Publishing"
type: concept
Sources:
  - lib/cli.ts
Categories:
  - deployment
  - github
  - publishing
date-created: 2026-05-21T03:00:00+00:00
last-updated: 2026-05-21T03:00:00+00:00
confidence: high
---

# GitHub Pages Publishing

## Definition

GitHub Pages Publishing is AkashaRender's built-in deployment feature that pushes rendered website content to a GitHub Pages branch (typically `gh-pages`) using the gh-pages npm library, handling Git operations like commit creation, force pushing, and branch management automatically with configurable options for repository URLs, branch names, CNAME files, and Git user credentials (source: [lib/cli.ts](../../lib/cli.ts):25,240-305).

## How It Works

Publishing is implemented as the `gh-pages-publish <configFN>` CLI command that wraps the gh-pages npm library (source: [lib/cli.ts](../../lib/cli.ts):240-305):

**Command Structure** (source: [lib/cli.ts](../../lib/cli.ts):240-294):
```
akasharender gh-pages-publish <configFN> [options]
```

**Configuration Options**:
- `--branch <branch>` - Target branch name (default: gh-pages)
- `--repo <repo>` - Repository URL (default: origin)
- `--remote <remote>` - Git remote name
- `--cname <cname>` - CNAME file content for custom domains
- `--user-name <userName>` - Git commit author name
- `--user-email <userEmail>` - Git commit author email
- `--message <message>` - Commit message

**Publishing Process** (source: [lib/cli.ts](../../lib/cli.ts):298-301):
1. Loads AkashaRender configuration from specified config file
2. Builds options object from command-line arguments
3. Calls `ghpages.publish(config.renderDestination, options, callback)`
4. gh-pages library handles:
   - Creating/switching to target branch
   - Removing existing files
   - Copying rendered content
   - Creating Git commit
   - Force pushing to remote

**Library Integration**: Uses the gh-pages npm package which provides the underlying Git operations (source: [lib/cli.ts](../../lib/cli.ts):25,298):
```typescript
import ghpages from 'gh-pages';
ghpages.publish(config.renderDestination, options, function(err) {
    if (err) console.error(err);
    else console.log('Published');
});
```

**Error Handling**: Catches and reports errors from both configuration loading and publishing operations (source: [lib/cli.ts](../../lib/cli.ts):302-305).

**Render Destination**: Publishes contents of `config.renderDestination` directory, which should contain the fully rendered site (source: [lib/cli.ts](../../lib/cli.ts):298).

## Key Parameters

**configFN**: Path to configuration file containing `renderDestination` and other settings (source: [lib/cli.ts](../../lib/cli.ts):240).

**--branch**: Git branch to publish to, conventionally `gh-pages` for project pages (source: [lib/cli.ts](../../lib/cli.ts)).

**--repo**: Repository URL, can be HTTPS or SSH format (source: [lib/cli.ts](../../lib/cli.ts)).

**--cname**: Domain name for CNAME file, required for custom domains on GitHub Pages (source: [lib/cli.ts](../../lib/cli.ts)).

**--user-name / --user-email**: Git author information for the deployment commit, useful in CI/CD environments where Git config may not be set (source: [lib/cli.ts](../../lib/cli.ts)).

**--message**: Custom commit message, otherwise gh-pages uses default message (source: [lib/cli.ts](../../lib/cli.ts)).

**config.renderDestination**: Directory containing rendered site content to be published (source: [lib/cli.ts](../../lib/cli.ts):298).

## When To Use

**Automated Deployment**: Integrate in CI/CD pipelines to automatically deploy on successful builds (source: [lib/cli.ts](../../lib/cli.ts)).

**Quick Publishing**: Rapidly deploy site changes without manual Git operations (source: [lib/cli.ts](../../lib/cli.ts)).

**GitHub Project Sites**: Deploy project documentation or demos to GitHub Pages (source: [lib/cli.ts](../../lib/cli.ts)).

**Custom Domains**: Use `--cname` option to configure custom domain deployment (source: [lib/cli.ts](../../lib/cli.ts)).

**Multiple Environments**: Use different branches for staging/production deployments (source: [lib/cli.ts](../../lib/cli.ts)).

## Risks & Pitfalls

**Force Push**: gh-pages library uses force push, potentially overwriting history. Avoid manual commits to gh-pages branch (source: [lib/cli.ts](../../lib/cli.ts):298).

**No Rollback**: Force push destroys previous commits. Consider keeping backups or using separate branches for testing (source: [lib/cli.ts](../../lib/cli.ts)).

**Authentication Required**: Publishing requires push access to repository. Ensure Git credentials are configured or use SSH keys (source: [lib/cli.ts](../../lib/cli.ts)).

**Repository State**: Command assumes Git repository is properly initialized and remote is configured (source: [lib/cli.ts](../../lib/cli.ts)).

**Build First**: Publishing doesn't automatically render site. Must run `render` command first (source: [lib/cli.ts](../../lib/cli.ts):298).

**CNAME Persistence**: CNAME file is recreated on each publish. Don't manually edit it in gh-pages branch (source: [lib/cli.ts](../../lib/cli.ts)).

**CI/CD Configuration**: In automated environments, must configure Git user name/email or use command options (source: [lib/cli.ts](../../lib/cli.ts)).

**Error Messages**: Errors from gh-pages library may not be detailed. Check Git configuration and network connectivity if publishing fails (source: [lib/cli.ts](../../lib/cli.ts):300-301).

**Rate Limiting**: Frequent force pushes may trigger GitHub rate limits. Avoid unnecessary republishing (source: [lib/cli.ts](../../lib/cli.ts)).

## Sources

- [lib/cli.ts](../../lib/cli.ts) - gh-pages-publish command implementation

## Related Pages

- [Command-Line Interface](./command-line-interface.md) - CLI commands including publishing
- [Site Rendering](./site-rendering.md) - Prerequisite step before publishing
- [Configuration Class](./configuration-class.md) - renderDestination configuration

## Backlinks
