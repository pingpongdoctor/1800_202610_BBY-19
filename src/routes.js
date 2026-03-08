const times = {
    walking: ['50 Min', '20 Min', '45 Min'],
    cycling: ['20 Min', '10 Min', '18 Min'],
    transit: ['30 Min', '15 Min', '25 Min']
};

function updateTimes(mode) {
    document.querySelectorAll('.route-time').forEach((cell, i) => {
        cell.textContent = times[mode][i];
    });
}

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateTimes(btn.dataset.mode);
    });
});

updateTimes('walking');
