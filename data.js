import https from 'https';
import chalk from 'chalk';
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB9mCnzLxpSSzxKME5RXfkT192p6eJZXF0",
  authDomain: "farcaster-post-permissionless.firebaseapp.com",
  projectId: "farcaster-post-permissionless",
  storageBucket: "farcaster-post-permissionless.appspot.com",
  messagingSenderId: "8658554511",
  appId: "1:8658554511:web:9a2cf74d827a3a38f52afa",
  measurementId: "G-38KRYD1258",
  databaseURL: "https://farcaster-post-permissionless-default-rtdb.europe-west1.firebasedatabase.app"
};
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

import { getDatabase, ref, set, child, get, remove} from "firebase/database";
const db = getDatabase();

let sepgraph_additions_total = 0;
let sepgraph_new = 0;

function storeFids(id, timestamp) {
  set(ref(db, 'graph/' + timestamp), {
    fid: id,
    //unixtime: timestamp
  });
}

function storeSeparateFids(id, timestamp) {
  set(ref(db, 'sepgraph/' + timestamp), {
    fid: id,
    //unixtime: timestamp
  });
}

async function updateLatest(id, timestamp, username, address) {
  await set(ref(db, 'latest/' + timestamp), {
    fid: id,
    name: username,
    owner: address,
    unixtime: timestamp
  });
  console.log(` Adding ${chalk.yellow(timestamp)} to latest.`)
}

async function deleteRecord(key) {
  const dbReference = ref(getDatabase(), key); // Create a reference to the data location you want to delete
  await remove(dbReference); // Use the remove() function to delete data at the reference
}

async function deleteTopNRecords(additionsLength) {
  const dbRef = ref(getDatabase());
  const snapshot = await get(dbRef, 'latest/');
  if (snapshot.exists()) {
    const data = snapshot.val();
    const fids = Object.keys(data.latest);
    const fidToDelete = fids.slice(0, additionsLength); // Get top keys up to additionsLength
    for (const key of fidToDelete) {
      await deleteRecord('latest/' + key); // Delete each record
      console.log(`Deleted ${chalk.yellow(key)} from latest.`)
    }
  }
}

function retain10latest () {
  const dbRef = ref(getDatabase());
  const snapshot = get(dbRef, 'latest/');
  if (snapshot.exists()) {
    const data = snapshot.val();
    const fids = Object.keys(data.latest);
    fids.sort((a, b) => b - a);
    const fidToDelete = fids.slice(0, 10); // Get top 10 keys
    for (const key of fidToDelete) {
      deleteRecord('latest/' + key); // Delete each record
    }
  }
}

function fetchExisting(id) {
  https.get(`https://fnames.farcaster.xyz/transfers?from_id=${id}`, async (response) => {
    console.log(`Fetching ids from ID ${chalk.yellow(id+1)} to ${chalk.yellow(id+100)}.`)
    let data = '';
    response.on('data', (chunk) => {
      data += chunk;
    });
    sepgraph_new = 0;
    response.on('end', async () => {
      let parsedData = JSON.parse(data)
      parsedData.transfers.forEach(item => {
        const { id, timestamp } = item;
        if (id <= 701 || id % 15 === 0) {
          storeSeparateFids(id, timestamp);
          sepgraph_additions_total += 1
          sepgraph_new += 1
        }
        storeFids(id, timestamp);
      });

      let accountCount = parsedData.transfers.length
      if (parsedData.transfers.length <100) {
        console.log(`Final batch of ${chalk.yellow(accountCount)} accounts added from id batch ${chalk.yellow(id+1)}, with ${sepgraph_additions_total} (${sepgraph_new} new) added to Separate Graph.`)
        console.log(``)
        console.log(`Running fetchNew...`)
        fetchNewest()
      }
      else {
        console.log(`Added ${chalk.yellow(accountCount)} accounts from id batch ${chalk.yellow(id+1)}, with ${sepgraph_additions_total} (${sepgraph_new} new) added to Separate Graph.`)
        console.log(``)
        fetchExisting(id+100)
      }
    });
  }).on('error', (error) => {
    console.error(error);
  });
}

let accountCount_total = 0
sepgraph_additions_total = 0;
function fetchNew(timestamp) {
  let next_ts = 0;
  let new_batch_needed;
  https.get(`https://fnames.farcaster.xyz/transfers?from_ts=${timestamp}`, async (response) => {
    let data = '';
    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', async () => {
      let parsedData = JSON.parse(data)
      if (parsedData.transfers.length === 0) {
        console.log(`No accounts in batch ${chalk.yellow(timestamp)}`)
        process.exit(0);
      }
      
      let accountCount = parsedData.transfers.length
      console.log(`${accountCount} accounts fetched in batch ${chalk.yellow(timestamp)}.`)
      accountCount_total += accountCount
      if (accountCount > 10) {
        if (accountCount === 100) {
          new_batch_needed = true;
        }
        accountCount = 10
      }
      await deleteTopNRecords(accountCount)   

      let latestObjects = parsedData.transfers.slice(-accountCount);
      for (let i = 0; i < latestObjects.length; i++) {
        const object = latestObjects[i];
        await updateLatest(object.id, object.timestamp, object.username, object.owner);
        if (i === latestObjects.length - 1) {
          next_ts = object.timestamp + 1
        }  
      }
      
      parsedData.transfers.forEach(item => {
        const { id, timestamp } = item;
        if (id % 5 === 1) {
          storeSeparateFids(id, timestamp);
          sepgraph_additions_total += 1
        }
        storeFids(id, timestamp);
      });

      console.log(`Added ${chalk.yellow(accountCount_total)} accounts from timestamp ${chalk.yellow(original_timestamp)}, with ${chalk.yellow(sepgraph_additions_total)} added to Separate Graph.`)
      if (new_batch_needed == true) {
        console.log(``)
        fetchNew(next_ts);
      } else {
        console.log(``)
        console.log(`Use this timestamp next: ${chalk.yellow(next_ts)}`)
        process.exit(0);
      }
    });

  }).on('error', (error) => {
    console.error(error);
  });
}

let original_timestamp = 1705264946
function fetchNewest() {
  fetchNew(original_timestamp)
}
fetchNewest()
//fetchExisting(0) // will fetch every accout from id 0
//deleteRecord('graph/');

// Run fetchData every 600 seconds
//setInterval(fetchData, 600 * 1000);