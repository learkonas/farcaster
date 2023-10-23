import https from 'https';
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

function storeFids(id, timestamp, username, address) {
  set(ref(db, 'graph/' + timestamp), {
    fid: id,
    unixtime: timestamp
  });
}

function updateLatest(id, timestamp, username, address) {
  set(ref(db, 'latest/' + timestamp), {
    fid: id,
    name: username,
    owner: address,
    unixtime: timestamp
  });
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


function fetchData(timestamp) {
  let next_ts = 0;
  let new_batch_needed;
  https.get(`https://fnames.farcaster.xyz/transfers?from_ts=${timestamp}`, async (response) => {
    let data = '';
    //console.log("Fetching 100 ids from timestamp:", ts)
    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', async () => {
      let parsedData = JSON.parse(data)
      if (parsedData.transfers.length === 0) {
        console.log("No accounts in this batch.")
        process.exit(0);
        return;
      }
      
      let accountCount = parsedData.transfers.length
      console.log(accountCount, "accounts fetched in this batch.")
      if (accountCount > 10) {
        if (accountCount === 100) {
          new_batch_needed = true;
        }
        accountCount = 10
      }
      //await deleteTopNRecords(accountCount)   

      let latestObjects = parsedData.transfers.slice(-accountCount);
      for (let i = 0; i < latestObjects.length; i++) {
        const object = latestObjects[i];
        updateLatest(object.id, object.timestamp, object.username, object.owner);
        if (i === latestObjects.length - 1) {
          next_ts = object.timestamp + 1
          console.log(next_ts)
        }  
      }
      
      parsedData.transfers.forEach(item => {
        const { id, timestamp, username, owner } = item;
        storeFids(id, timestamp, username, owner);
      });
      //res.send(data);
      /*
      // Fetch next batch of data*/
      if (new_batch_needed == true) {
        console.log("Collecting the next batch from timestamp", next_ts)
        fetchData(next_ts);
      } else {
        process.exit(0);
      }
    });

  }).on('error', (error) => {
    console.error(error);
  });
}

fetchData(1698070120)
// Run fetchData every 600 seconds
//setInterval(fetchData, 600 * 1000);