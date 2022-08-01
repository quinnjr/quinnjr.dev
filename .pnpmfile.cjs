const overrides = JSON.parse(
  require('fs').readFileSync(__dirname + '/package.json', 'utf-8')
);

if (overrides) {
  const readPackage = (pkg, context) => {
    if (pkg.dependencies) {
      for (const d in overrides) {
        if (pkg.dependencies[d] && pkg.dependencies[d] !== overrides[d]) {
          context.log(
            `"${d}@{pkg.dependencies[k]}" overriden in "${pkg.name}" to "${d}@${resolutions[d]}"`
          );
          pkg.dependencies[d] = overrides[d];
        }
      }
    }

    return pkg;
  }

  module.exports = {
    hooks: {
      readPackage
    }
  };
} else {
  module.exports = {};
}
