import exampleRoute from './server/routes/example';

export default function (kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch'],

    uiExports: {
      
      app: {
        title: 'Kibana Csv Importer Plugin',
        description: 'An awesome Kibana plugin',
        main: 'plugins/kibana_csv_importer_plugin/app'
      },
      
      
      hacks: [
        'plugins/kibana_csv_importer_plugin/hack'
      ]
      
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    
    init(server, options) {
      // Add server routes and initalize the plugin here
      exampleRoute(server);
    }
    

  });
};
