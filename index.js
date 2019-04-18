#!/usr/bin/env node

const express = require('express');
const path = require('path');
const { ArgumentParser } = require('argparse');

const middleware = require('./middleware');

const parser = new ArgumentParser({
    version: require('gatsby-plugin-sharp/package.json').version,
    addHelp: true,
    description: 'gatsby-plugin-sharp as a HTTP service'
});
parser.addArgument(
    ['--port'], {
        help: 'port to listen on',
        defaultValue: 3000,
    },
);
parser.addArgument(
    ['--host'], {
        help: 'host to listen on',
    },
);

parser.addArgument(
    ['--directory'], {
        help: 'working directory',
        defaultValue: process.cwd(),
    },
);

const args = parser.parseArgs();

const ROOTDIR=args.directory;
const IMGDIR=path.join(ROOTDIR, 'img');

process.on('unhandledRejection', error => {
    console.error('unhandledRejection', error);
});

process.chdir(ROOTDIR);
const app = express();
app.use(express.json());

app.post('/', middleware(IMGDIR));

app.listen(args.port, args.host, err => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
});
