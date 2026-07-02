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
const imageTag = config.get('imageTag') ?? 'latest';
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

const dbUser = new digitalocean.DatabaseUser(`${appName}-user`, {
  clusterId: dbCluster.id,
  name: 'quinnjr',
});

// Prisma connection string for the dedicated database + user. Managed PG
// requires TLS, hence sslmode=require.
const databaseUrl = pulumi
  .all([dbUser.name, dbUser.password, dbCluster.host, dbCluster.port, database.name])
  .apply(
    ([user, password, host, port, name]) =>
      `postgresql://${user}:${password}@${host}:${port}/${name}?sslmode=require`
  );

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
        healthCheck: { httpPath: '/', initialDelaySeconds: 20 },
        envs: [
          { key: 'NODE_ENV', value: 'production', scope: 'RUN_TIME' },
          { key: 'PORT', value: '4000', scope: 'RUN_TIME' },
          { key: 'DATABASE_URL', value: databaseUrl, type: 'SECRET', scope: 'RUN_TIME' },
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

    // Apply Prisma migrations before every rollout. The runtime image ships the
    // prisma CLI (a runtime dependency) and prisma/migrations, so this succeeds
    // against the managed database before the new service instances start.
    jobs: [
      {
        name: 'migrate',
        kind: 'PRE_DEPLOY',
        instanceSizeSlug: appInstanceSize,
        image,
        runCommand: 'pnpm exec prisma migrate deploy',
        envs: [{ key: 'DATABASE_URL', value: databaseUrl, type: 'SECRET', scope: 'RUN_TIME' }],
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
