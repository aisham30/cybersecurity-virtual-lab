'use strict';
const docker = require('../app/main/dockerService');

async function main() {
  console.log('🧹 Purging all leftover VLab managed Docker resources…\n');
  try {
    const res = await docker.cleanupManaged();
    console.log(`✨ Cleanup completed successfully:`);
    console.log(`   Containers removed: ${res.containers}`);
    console.log(`   Networks removed:   ${res.networks}`);
    console.log(`   Volumes removed:    ${res.volumes}\n`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Cleanup failed: ${err.message}`);
    process.exit(1);
  }
}

main();
