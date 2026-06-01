# LAA Record Controlled Work
[![Standards Icon]][Standards Link]
![govuk-frontend 6.1.0](https://img.shields.io/badge/govuk--frontend%20version-6.1.0-005EA5?logo=gov.uk&style=flat)

## Template

This repo was generated from [laa-express-typescript-template](https://ministryofjustice.github.io/laa-express-typescript-template/)
## Get Started
### Prerequisites

- [Node 25.9.0](https://nodejs.org/en/blog/release/v25.9.0/)

#### Installing Yarn

This project uses Yarn 4.14.1 managed by corepack (built into Node.js 16.10+). To ensure all team members use the same version, follow these installation steps:

1. **Enable corepack (if not already enabled):**

   ```shell
   corepack enable
   ```

2. **Install dependencies:**

   ```shell
   yarn install
   ```

3. **Verify the installation:**

   ```shell
   yarn --version
   # Should output: 4.14.1
   ```

**To Note:**
- Corepack automatically uses the Yarn version specified in the `packageManager` field of `package.json`. No additional setup is required once corepack is enabled
- `yarn install --immutable` ensures that the lockfile (`yarn.lock`) is not modified during the installation process
- Renovate can raise PRs for vulnerability patches, but `npmMinimalAgeGate: 7d` in `.yarnrc.yml` will cause Renovate to fail when generating artifacts (creating the lockfile).
  - Check out the failing Renovate branch
  - Run `YARN_NPM_MINIMUM_PACKAGE_AGE=0 yarn up <package>` to skip the quarantine period
  - Commit the updated yarn.lock and push it to unblock the PR.

### Start the application

#### Set local environment variables

Create your local config file `.env` from the template file:

```shell
cp .env.example .env
```

#### Align to the Node version specified for this project

If using Node Version Manager (nvm):

```shell
nvm use
nvm install
```

If using [Mise](https://mise.jdx.dev/):

```shell
mise install
```

#### Install dependencies and run for development

```shell
yarn install
yarn build
yarn dev
```

Then load http://localhost:3000/ in your browser.

#### Install dependencies and run for production

```shell
yarn install
yarn build
yarn start
```

#### Running locally with Docker

Prerequisites: Docker Desktop

```shell
# Build the image
make docker-build

# Run the image (available at http://localhost:8888)
make docker-run

# Stop the container
docker ps                      # get container ID
docker stop {container_id}
```

### 1Password CLI Setup

```sh
brew install 1password-cli
```

1. Open and unlock the [1Password app](https://1password.com/downloads/).
2. Select your account or collection at the top of the sidebar.
3. Navigate to **Settings** > **[Developer](onepassword://settings/developers)**.
4. Select **Integrate with 1Password CLI**.
5. If you want to authenticate 1Password CLI with your fingerprint, turn on **[Touch ID](https://support.1password.com/touch-id-mac/)** in the app.

After you've turned on the app integration, enter any command and you'll be prompted to authenticate. For example, run this command to see all the vaults in your account:

```sh
op vault list
```

See [1Password CLI docs](https://developer.1password.com/docs/cli/get-started/) for more detail.

### Populating your `.env` with secrets

Secret references in `.env` follow this format:

```
op://<vault>/<item>[/<section>]/<field-name>
```
 - **section** is optional, dependent on whether you have added sections

Example:

```sh
ENTRA_CLIENT_ID="op://Dev/RCW/ENTRA_CLIENT_ID"
ENTRA_CLIENT_SECRET="op://Dev/RCW/ENTRA_CLIENT_SECRET"
```

See [secret reference syntax](https://developer.1password.com/docs/cli/secret-reference-syntax) for full details.

### Running the application with secrets injected

```sh
op run --env-file=.env -- <your command>
```

Add `--no-masking` to print env var values to the terminal for debugging.

### Microsoft Entra ID Authentication

This application uses [Microsoft Entra](https://learn.microsoft.com/en-us/entra/identity/) for authentication via the [MSAL Node](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node) library.

#### Auth flow

1. User visits any protected route → `requireAuth` middleware redirects to `/auth/signin`
2. `/auth/signin` generates a PKCE code verifier/challenge pair, stores them in the session, and redirects the user to the Entra ID login page
3. After login, Entra POSTs an authorisation code back to `/auth/code/callback`
4. The callback exchanges the code for tokens via MSAL, stores the token cache and account on the session, and sets `session.isAuthenticated = true`
5. `/auth/signout` destroys the session and redirects to the Entra logout URL

CSRF protection is not applied to `/auth/code/callback` — it is secured by the PKCE `state` parameter instead.

#### Required environment variables

| Variable | Description |
|---|---|
| `ENTRA_CLIENT_ID` | Application (client) ID from the Entra app registration |
| `ENTRA_CLIENT_SECRET` | Client secret from the Entra app registration |
| `ENTRA_TENANT_ID` | Directory (tenant) ID |
| `ENTRA_AUTHORITY_BASE_URL` | Authority base URL (e.g. `https://login.microsoftonline.com/`) |
| `ENTRA_REDIRECT_URI` | Redirect URI registered in Entra for auth code callback |

These values are stored in 1Password and injected at runtime via the 1Password CLI (see above).

#### Ephemeral environments and redirect URIs

This project uses ephemeral (per-branch) environments for deployment. Because Entra app registrations require redirect URIs to be explicitly allowlisted, authentication will not work out of the box when a new ephemeral environment is spun up — the dynamically generated URL for your branch will not be registered.

To test authentication on an ephemeral environment:

1. Find the redirect URI for your branch (e.g. `https://<branch-name>.example.com/auth/code/callback`)
2. Add it to the Entra app registration:
   - Go to [portal.azure.com](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations** → select the app
   - Under **Authentication**, add the redirect URI for your branch
   - Save
3. Test your branch as normal
4. **Remove the redirect URI when you are done** — stale entries are a security risk

Do not leave branch-specific redirect URIs in the app registration after the ephemeral environment has been torn down.

#### Bypassing Entra for local/E2E testing

Set `PLAYWRIGHT_TEST_SIGNIN=true` to enable a `/test/signin` route that sets `session.isAuthenticated = true` without going through Entra. This is used by Playwright E2E tests and should **never** be enabled in production.

### GitHub Actions

[Workflow summaries](.github/workflows/WORKFLOWS_SUMMARIES.md)

### Licence

[Licence](./LICENSE)

[Standards Link]: https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/public-report/govuk-frontend-express "Change this to point at your repo. Also needs changing in the url in the icon below."
[Standards Icon]: https://img.shields.io/endpoint?labelColor=231f20&color=005ea5&style=for-the-badge&label=MoJ%20Compliant&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fapi%2Fv1%2Fcompliant_public_repositories%2Fendpoint%2Fgovuk-frontend-express&logo=data:image/png;base64,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