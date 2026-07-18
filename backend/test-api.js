

async function run() {
  console.log('1. Creating Repo...');
  const repoRes = await fetch('http://localhost:4000/api/repos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner: 'tj',
      name: 'commander.js',
      githubRepoId: 'commander-123',
      defaultBranch: 'master'
    })
  });
  
  if (!repoRes.ok) {
    console.error('Failed to create repo:', await repoRes.text());
    return;
  }
  const repo = await repoRes.json();
  console.log('Created Repo:', repo.id);

  console.log('2. Starting Scan...');
  const scanRes = await fetch(`http://localhost:4000/api/repos/${repo.id}/scans`, {
    method: 'POST'
  });
  
  if (!scanRes.ok) {
    console.error('Failed to start scan:', await scanRes.text());
    return;
  }
  const scanData = await scanRes.json();
  console.log('Scan Response:', scanData);
  const scanId = scanData.scanId;

  console.log('3. Polling for completion...');
  let attempts = 0;
  while (attempts < 60) {
    const statusRes = await fetch(`http://localhost:4000/api/scans/${scanId}`);
    const statusData = await statusRes.json();
    console.log(`Scan Status: ${statusData.status}`);
    if (statusData.status === 'COMPLETED') {
      console.log('Scan completed!');
      
      const filesRes = await fetch(`http://localhost:4000/api/scans/${scanId}/files`);
      const files = await filesRes.json();
      console.log(`Found ${files.length} files.`);
      console.log('Top 3 riskiest files:');
      console.log(files.slice(0, 3).map(f => `${f.filePath} | Score: ${f.riskScore.toFixed(3)} | Churn: ${f.churnCount} | Cyclo: ${f.complexityCyclomatic}`));
      break;
    } else if (statusData.status === 'FAILED') {
      console.error('Scan failed:', statusData.errorMessage);
      break;
    }
    
    await new Promise(r => setTimeout(r, 2000));
    attempts++;
  }
}
run();
