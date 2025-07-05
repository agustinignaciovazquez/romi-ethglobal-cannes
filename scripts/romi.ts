async function main() {

}


void main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});

function getTokens() {
    const address = '0x8E484b34356111a9F642efF09B2635311600AD65'
    const options = {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJLTVNFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODc3MTYwMzgsImp0aSI6IjQyMWVmMDIwLWFiYjYtNDEyMi1hMjFhLTcwOGJjOWE3MTJiZSIsImlhdCI6MTc1MTcxNjAzOCwiaXNzIjoiZGZ1c2UuaW8iLCJzdWIiOiIwbW9kdTdmNTUyMTRlYTViNzY3OGUiLCJ2IjoxLCJha2kiOiJhZWRmMjk0MGQ1ZDhjOTU3NWM4NjRkYzVhOTJiMzE0MTdlY2UzNmI1MzVlOGRiMWE2YjVmODU3MzFjZTY0NWMxIiwidWlkIjoiMG1vZHU3ZjU1MjE0ZWE1Yjc2NzhlIn0.CbtoA-dagXibGBAtVgGnnbEF8XwSUxRXTE3Xpxd-K9tjVJXd9id8mfXOT3zbHVgW0mSRSfgGK5HT2rfhxEVTdw',
        },
    }

    fetch(`https://token-api.thegraph.com/balances/evm/${address}`, options)
    .then((response) => response.json())
    .then((response) => console.log(response))
    .catch((err) => console.error(err))
 }
