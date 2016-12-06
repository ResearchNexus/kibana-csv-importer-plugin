'use strict';

import Promise from 'bluebird';
import randomstring from 'randomstring';
import {
    name as pluginName
} from '../../package.json';

const async = Promise.coroutine;
const rootUrl = `/api/${pluginName}/es`;

export default function (server) {
    const client = server.plugins.elasticsearch.client;

    const generateRandomPodName = () => `pod_${randomstring.generate({capitalization:'lowercase'})}`;

    const indexExists = function*(podName) {
        try {
            yield* client.indices.exists(podName);
        } catch (e) {
            return false;
        }

        return true;
    };

    const createRandomPod = async(function*() {
        let podName = generateRandomPodName();
        let exists = yield* indexExists(podName);

        while(exists) {
            podName = generateRandomPodName();
            exists = yield* indexExists(podName);
        }

        yield client.indices.create({
            index: podName
        });

        return podName;
    });

    server.route({
        path: `${rootUrl}/pods`,
        method: 'GET',
        handler: async(function*(req, reply) {
            try {

                const pods = (yield client.cat.indices({
                    h: 'index'
                })).split('\n').filter((podName) => podName);

                reply({
                    body: {
                        pods
                    }
                });
            } catch (error) {
                reply({
                    error
                });
            }
        })
    });

    server.route({
        path: `${rootUrl}/pod`,
        method: 'POST',
        handler: async(function*(req, reply) {
            try {
                let podName = yield createRandomPod();

                reply({
                    body: {
                        podName
                    }
                });
            } catch (error) {
                reply({
                    error
                });
            }
        })
    });

    server.route({
        path: `${rootUrl}/import`,
        method: 'POST',
        handler: async(function*(req, reply) {
            const payload = req.payload;

            try {
                const response = yield client.create({
                    index: payload.podName,
                    type: payload.type,
                    id: payload.data.id,
                    body: payload.data
                });

                reply({
                    body: response
                });
            } catch (error) {
                reply({
                    error
                });
            }
        })
    });
};
