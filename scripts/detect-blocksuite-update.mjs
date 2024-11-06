const { exec } = await import('node:child_process');
const { fileURLToPath } = await import('node:url');
const { readdir } = await import('node:fs/promises');
const { join } = await import('node:path');

async function readJsonFromCommit(commit, file) {
  function readFile(commit, file) {
    return new Promise((resolve, reject) => {
      exec(`git show ${commit}:${file}`, (error, stdout, stderr) => {
        if (error) {
          reject(stderr);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  try {
    const content = await readFile(commit, file);
    return JSON.parse(content);
  } catch {}
}

function checkBlocksuiteChanged(oldPkg, newPkg) {
  const changed = new Set();
  const keys = ['dependencies', 'devDependencies'];

  keys.forEach(key => {
    const oldDeps = oldPkg[key] || {};
    const newDeps = newPkg[key] || {};

    Object.keys(newDeps).forEach(dep => {
      if (newDeps[dep] !== oldDeps[dep] && dep.startsWith('@blocksuite/')) {
        changed.add(dep);
      }
    });
  });

  return changed;
}

async function findPackageJson(root) {
  const packages = new Set();

  async function walk(dir) {
    const files = await readdir(dir, { withFileTypes: true });

    for (const file of files) {
      if (file.isDirectory() && file.name !== 'node_modules') {
        await walk(join(dir, file.name));
      } else if (file.name === 'package.json') {
        let path = join(dir.replace(root, ''), file.name);
        if (path.startsWith('/')) {
          path = path.slice(1);
        }
        packages.add(path);
      }
    }
  }

  await walk(root);

  return packages;
}

async function main() {
  const commitHash = process.argv[2] || process.env.GITHUB_BASE_REF;
  const currentHead = process.argv[3] || 'HEAD';
  if (!commitHash) {
    console.error('Missing base ref commit hash, skipping check.');
    process.exit(1);
  }

  const changedPackages = new Set();
  const folders = await findPackageJson(
    join(fileURLToPath(import.meta.url), '..', '..')
  );

  for (const packagePath of folders) {
    const old = await readJsonFromCommit(commitHash, packagePath);
    const current = await readJsonFromCommit(currentHead, packagePath);
    console.log('checking:', packagePath);
    if (
      old &&
      current &&
      typeof old === 'object' &&
      typeof current === 'object'
    ) {
      for (const p of checkBlocksuiteChanged(old, current)) {
        changedPackages.add(p);
      }
    }
  }

  if (changedPackages.size > 0) {
    console.log('Blocksuite packages have been updated.', changedPackages);
    process.exit(0);
  } else {
    console.log('No changes to Blocksuite packages.');
    process.exit(1);
  }
}

main().catch(console.error);
