const { spawnSync } = require("child_process");

function run(command, args) {
  const printable = [command, ...args].join(" ");
  console.log(`\n> ${printable}`);
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function runShell(command) {
  console.log(`\n> ${command}`);
  const result = spawnSync(command, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

run("node", ["--check", "app.js"]);
run("node", ["--check", "service-worker.js"]);
runShell('npx -p playwright -c "node tests/smoke-event-ready.cjs"');
