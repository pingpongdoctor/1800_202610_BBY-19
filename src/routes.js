import { db } from './firebaseConfig.js';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

let routesData = [];

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

getDocs(query(collection(db, 'routes'), orderBy('order'))).then(snapshot => {
    snapshot.forEach(doc => {
        routesData.push(doc.data());
    });
    updateTimes('walking');
});
