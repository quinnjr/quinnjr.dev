import * as digitalocean from '@pulumi/digitalocean';
import * as pulumi from '@pulumi/pulumi';

// ---------------------------------------------------------------------------
// Configuration
//
// Non-secret values live in Pulumi.<stack>.yaml. Secrets are set out of band
// with `pulumi config set --secret` and encrypted by the passphrase secrets
// provider (PULUMI_CONFIG_PASSPHRASE). See the PR description for the full list.
// ---------------------------------------------------------------------------
const config = new pulumi.Config();

const dbRegion = config.get('region') ?? 'nyc3'; // managed-DB region slug
const appRegion = config.get('appRegion') ?? 'nyc'; // App Platform datacenter
const appInstanceSize = config.get('appInstanceSize') ?? 'basic-xxs';
const dbSize = config.get('dbSize') ?? 'db-s-1vcpu-1gb';
const dbNodeCount = config.getNumber('dbNodeCount') ?? 1;
const domainName = config.get('domainName') ?? 'quinnjr.dev';
const githubOwner = config.get('githubOwner') ?? 'quinnjr';
const imageRepository = config.get('imageRepository') ?? 'quinnjr.dev';
// Required, not defaulted to 'latest': every deploy must pin an immutable tag
// (CI passes the built image's tag; local runs set it via `pulumi config set`).
const imageTag = config.require('imageTag');
// Create the DNS zone here, or assume it already exists in the DO account.
const manageDnsZone = config.getBoolean('manageDnsZone') ?? false;

// Secrets
const jwtSecret = config.requireSecret('jwtSecret');
const githubApiToken = config.requireSecret('githubApiToken');
// GHCR is private; App Platform needs "<username>:<PAT>" to pull the image.
const ghcrCredentials = config.requireSecret('ghcrCredentials');

const appName = 'quinnjr-dev';

// ---------------------------------------------------------------------------
// Managed PostgreSQL
// ---------------------------------------------------------------------------
const dbCluster = new digitalocean.DatabaseCluster(`${appName}-pg`, {
  engine: 'pg',
  version: '16',
  size: dbSize,
  region: dbRegion,
  nodeCount: dbNodeCount,
});

const database = new digitalocean.DatabaseDb(`${appName}-db`, {
  clusterId: dbCluster.id,
  name: 'quinnjr',
});

// Scoped runtime user. On DO managed Postgres the database is owned by the
// admin (doadmin); this user owns nothing and is granted DML only (see the
// migrate job below), so the long-lived web service can't run DDL, reach other
// databases, or otherwise act as admin.
const dbUser = new digitalocean.DatabaseUser(`${appName}-user`, {
  clusterId: dbCluster.id,
  name: 'quinnjr',
});

const pgUrl = (user: pulumi.Input<string>, password: pulumi.Input<string>): pulumi.Output<string> =>
  pulumi.all([user, password, dbCluster.host, dbCluster.port, database.name]).apply(
    ([u, p, host, port, name]) =>
      // Managed PG requires TLS, hence sslmode=require.
      `postgresql://${u}:${p}@${host}:${port}/${name}?sslmode=require`
  );

// Admin connection — used only by the ephemeral migration job (DDL + grants).
const adminDatabaseUrl = pgUrl(dbCluster.user, dbCluster.password);
// App connection — the scoped user the web service runs as.
const appDatabaseUrl = pgUrl(dbUser.name, dbUser.password);

// Grants applied by the migration job (as admin) so the scoped user can read
// and write every table/sequence, including those future migrations create.
// Idempotent, so it re-runs safely on each deploy.
const grantSql = [
  'GRANT USAGE ON SCHEMA public TO "quinnjr";',
  'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "quinnjr";',
  'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "quinnjr";',
  'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "quinnjr";',
  'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO "quinnjr";',
].join(' ');

// Shared image spec for both the service and the migration job.
const image: digitalocean.types.input.AppSpecServiceImage = {
  registryType: 'GHCR',
  registry: githubOwner,
  repository: imageRepository,
  tag: imageTag,
  registryCredentials: ghcrCredentials,
};

// ---------------------------------------------------------------------------
// App Platform application
// ---------------------------------------------------------------------------
const app = new digitalocean.App(appName, {
  spec: {
    name: appName,
    region: appRegion,

    // Custom domains — App Platform manages TLS and (when the zone lives in
    // this DO account) writes the DNS records into it.
    domainNames: [
      { name: domainName, type: 'PRIMARY', zone: domainName },
      { name: `www.${domainName}`, type: 'ALIAS', zone: domainName },
    ],

    services: [
      {
        name: 'web',
        instanceSizeSlug: appInstanceSize,
        instanceCount: 1,
        httpPort: 4000, // matches Dockerfile EXPOSE/PORT
        image,
        // Probe the dedicated /healthz endpoint, which is answered by Express
        // before SSR and so isn't subject to host validation.
        healthCheck: { httpPath: '/healthz', initialDelaySeconds: 20 },
        envs: [
          { key: 'NODE_ENV', value: 'production', scope: 'RUN_TIME' },
          { key: 'PORT', value: '4000', scope: 'RUN_TIME' },
          // Restrict SSR host validation to the app's real domains (custom
          // domain + App Platform's default ingress). The internal health
          // probe no longer needs a wildcard here — it uses /healthz.
          {
            key: 'SSR_ALLOWED_HOSTS',
            value: `${domainName},*.${domainName},*.ondigitalocean.app`,
            scope: 'RUN_TIME',
          },
          { key: 'DATABASE_URL', value: appDatabaseUrl, type: 'SECRET', scope: 'RUN_TIME' },
          { key: 'JWT_SECRET', value: jwtSecret, type: 'SECRET', scope: 'RUN_TIME' },
          {
            key: 'GITHUB_API_TOKEN',
            value: githubApiToken,
            type: 'SECRET',
            scope: 'RUN_TIME',
          },
        ],
      },
    ],

    // Before every rollout: apply migrations as admin (DDL), then grant the
    // scoped runtime user access to the resulting objects. Runs as the app, so
    // it reaches the DB through the firewall's trusted source. The image ships
    // the prisma CLI and prisma/migrations as runtime dependencies.
    jobs: [
      {
        name: 'migrate',
        kind: 'PRE_DEPLOY',
        instanceSizeSlug: appInstanceSize,
        image,
        // App Platform tokenizes run_command (it does NOT interpret && or |),
        // so wrap the pipeline in an explicit `sh -c`. The SQL is passed via the
        // GRANT_SQL env var rather than inline to avoid nested-quote breakage
        // (the SQL contains double-quoted identifiers).
        runCommand:
          `sh -c 'pnpm exec prisma migrate deploy && ` +
          `printf %s "$GRANT_SQL" | pnpm exec prisma db execute --stdin --schema prisma/schema.prisma'`,
        // Admin URL: migrations need DDL and the grants need admin rights.
        envs: [
          { key: 'DATABASE_URL', value: adminDatabaseUrl, type: 'SECRET', scope: 'RUN_TIME' },
          { key: 'GRANT_SQL', value: grantSql, scope: 'RUN_TIME' },
        ],
      },
    ],
  },
});

// Restrict the database firewall to the app: only it may connect.
new digitalocean.DatabaseFirewall(`${appName}-pg-fw`, {
  clusterId: dbCluster.id,
  rules: [{ type: 'app', value: app.id }],
});

// Optionally create the DNS zone. Off by default — the zone already exists in
// the DO account from the site's earlier DigitalOcean deployment.
if (manageDnsZone) {
  new digitalocean.Domain(`${appName}-domain`, { name: domainName });
}

export const appId = app.id;
export const appLiveUrl = app.liveUrl;
export const appDefaultIngress = app.defaultIngress;
export const databaseHost = dbCluster.host;
