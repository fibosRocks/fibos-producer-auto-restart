const fibos = require('fibos');
const fs = require('fs');
const timers = require('timers');
const http = require('http');

const snapshot_dir = './data/snapshots/'
const p2p_list = require('./config/p2p.json');

const config = {
    http_port: 8888,
    p2p_port: 9876,
    config_dir: "./config",
    data_dir: "./data"
}

function load_snapshot() {
    // load snapshot
    let lastest_snapshot = null;
    let lastest_time = new Date(0)

    const snapshots = fs.readdir(snapshot_dir)

    for (let snapshot of snapshots) {
        const snapshot_stat = fs.stat(`${snapshot_dir}${snapshot}`)
        if (snapshot_stat.mtime > lastest_time) {
            lastest_snapshot = snapshot
            lastest_time = snapshot_stat.mtime
        }
    }

    console.notice("snapshot:", lastest_snapshot);

    return lastest_snapshot;
}

function start_producer(use_snapshot) {

    const parameter = {}
    if (use_snapshot) {
        parameter["delete-all-blocks"] = true
        // load snapshot
        const snapshot_file_name = load_snapshot()
        parameter.snapshot = `${snapshot_dir}${snapshot_file_name}`
    }


    fibos.config_dir = config.config_dir;
    fibos.data_dir = config.data_dir;

    fibos.load("http", {
        "http-server-address": `0.0.0.0:${config.http_port}`
    });

    fibos.load("net", {
        "p2p-listen-endpoint": `0.0.0.0:${config.p2p_port}`,
        "p2p-peer-address": p2p_list,
        "p2p-max-nodes-per-host": 100,
        "agent-name": "fibosrockskr"
    });

    fibos.load("producer_api");

    fibos.load("chain", parameter);
    fibos.load("chain_api");
    fibos.enableJSContract = true;

    fibos.load("ethash");

    // producer only
    const producer_config = require('./config/producer.json');
    fibos.load("producer", {
        'producer-name': producer_config["producer-name"],
        'private-key': JSON.stringify([producer_config["public-key"], producer_config["private-key"]])
    });
    fibos.load("bp_signature", {
        "signature-producer": producer_config["producer-name"],
        "signature-private-key": producer_config["sign-key"]
    });

    fibos.start();
}

start_producer(true)

// check health
// timers.setInterval(() => {
//     console.notice("check health")
//     const httpClient = new http.Client();
//     try {
//         httpClient.request('GET', `http://127.0.0.1:${config.http_port}/v1/chain/get_info`);
//     } catch (err) {
//         console.notice("restart fibos use snapshot")
//         start_producer(true)
//     }
// }, 60 * 1000)

// take snapshots
timers.setInterval(() => {
    console.notice("take snapshot")
    const httpClient = new http.Client();
    // delete old snapshots
    const snapshot_files = fs.readdir(snapshot_dir)
    for (let snapshot of snapshot_files) {
        fs.unlink(`${snapshot_dir}${snapshot}`)
    }
    httpClient.request('GET', `http://127.0.0.1:${config.http_port}/v1/producer/create_snapshot`);
}, 10 * 60 * 1000)