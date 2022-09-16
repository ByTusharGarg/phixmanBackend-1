// Clustering to exploit all the cores of a machine. Node is single-threaded so it will use by default only 1 core.
var cluster = require('cluster')

if (cluster.isMaster) { // Master process
    var environment = process.env.NODE_ENV || 'development' // production to use express built-in cache middleware
    console.log('Running in %s environment', environment)

    var numCPUs = require('os').cpus().length

    for (var i = 0; i < numCPUs; i++) {
        cluster.fork() // 1 process per core
    }

    console.log('Master process online with PID', process.pid)

    cluster.on('online', function (worker) {
        console.log('Worker ' + worker.process.pid + ' is online')
    })

    cluster.on('exit', function (worker, code, signal) {
        console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal)
        console.log('Starting a new worker')
        cluster.fork()
    })
} else { // Worker process
    require('./app.js')
}

