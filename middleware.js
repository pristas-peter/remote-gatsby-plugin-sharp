const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const plugin = require('gatsby-plugin-sharp');
const {createFileNode} = require('gatsby-source-filesystem/create-file-node');
const { ImageFormatType,
    ImageCropFocusType,
    PotraceType} = require('gatsby-transformer-sharp/types');

const PotraceTurnPolicy = PotraceType._fields().turnPolicy.type;

function transformArgs(args) {
    if (args.traceSVG && args.traceSVG.turnPolicy) {
        args.traceSVG.turnPolicy = PotraceTurnPolicy._nameLookup[args.traceSVG.turnPolicy].value;
    }

    if (args.cropFocus) {
        args.cropFocus = ImageCropFocusType._nameLookup[args.cropFocus].value;
    }

    ['toFormat', 'toFormatBase64'].forEach(name => {
        if (args[name]) {
            args[name] = ImageFormatType._nameLookup[args[name]].value;
        }
    });
}

function download(url, dir) {
    const filepath = path.join(dir, url.pathname);
    return fs.mkdir(path.dirname(filepath), {recursive: true})
        .then(() => {
            const writer = fs.createWriteStream(filepath);

            return axios({
                url: url.href,
                method: 'GET',
                responseType: 'stream'
            })
            .then(response => {
                response.data.pipe(writer);
    
                return new Promise((resolve, reject) => {
                    writer.on('finish', () => {
                        resolve(filepath);
                    });
                    writer.on('error', reject);
                });
            });
        });
}

module.exports = (downloadDir) => (request, response) => {
    const {fn, file, options} = request.body;

    transformArgs(options);

    let url;

    try {
        url = new URL(file);
    } catch {
        // pass
    }

    let promise;

    if (url) {
        promise = download(url, downloadDir);
    } else {
        promise = Promise.resolve(file);
    }

    promise
        .then(filepath => {
            return createFileNode(filepath, id => id);
        })
        .then(node => {
            return plugin[fn]({file: node, args: options});
        })
        .then(output => {
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({data: output}));
        })
        .catch(err => {
            console.error(err);

            if (err.code === 'ENOENT') {
                response.status(400);
            } else {
                response.status(500);
            }

            response.send(err);
        });
}
