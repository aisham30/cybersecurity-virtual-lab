'use strict';
const docker = require('../app/main/dockerService');

async function main() {
  console.log('🔍 Checking Docker for leftover ICMP flood lab resources…\n');
  try {
    const list = await docker.listManaged('icmp-flood');
    const count = list.containers.length + list.networks.length + list.volumes.length;

    if (count === 0) {
      console.log('✨ Clean state confirmed: No leftover containers, networks, or volumes found.');
      process.exit(0);
    } else {
      console.warn(`⚠️ Found ${count} leftover VLab resource(s):`);
      if (list.containers.length) console.warn(`   Containers: ${list.containers.join(', ')}`);
      if (list.networks.length) console.warn(`   Networks: ${list.networks.join(', ')}`);
      if (list.volumes.length) console.warn(`   Volumes: ${list.volumes.join(', ')}`);
      console.warn('\nRun `npm run cleanup` to purge them.\n');
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Check failed: ${err.message}`);
    process.exit(1);
  }
}

main();
