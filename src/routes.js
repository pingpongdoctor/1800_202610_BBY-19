import { db } from './firebaseConfig.js';
import { collection, getDocs } from 'firebase/firestore';

let routesData = [];

// 
function updateTimes(mode) {
    document.querySelectorAll('.route-time').forEach((cell, i) => {
        cell.textContent = routesData[i] ? routesData[i][mode] ?? 'N/A' : 'N/A';
    });
}

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateTimes(btn.dataset.mode);
    });
});

getDocs(collection(db, 'routes')).then(snapshot => {
    snapshot.forEach(doc => {
        routesData.push(doc.data());
    });
    updateTimes('walking');
});
