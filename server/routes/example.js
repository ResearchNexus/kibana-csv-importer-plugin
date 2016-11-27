export default function (server) {

  server.route({
    path: '/api/kibana_csv_importer_plugin/example',
    method: 'GET',
    handler(req, reply) {
      reply({ time: (new Date()).toISOString() });
    }
  });

};
