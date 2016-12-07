import 'ng-file-upload';

import _ from 'lodash';
import Papa from 'papaparse';
import uiModules from 'ui/modules';
import uiRoutes from 'ui/routes';

import 'ui/autoload/styles';
import './less/main.less';
import template from './templates/index.html';

const getAllPods = '../api/kibana_csv_importer_plugin/es/pods';
const createPodUrl = '../api/kibana_csv_importer_plugin/es/pod';
const importUrl = '../api/kibana_csv_importer_plugin/es/import';

const onError = (error) => {
  window.alert(JSON.stringify(error, null, 2));
};

uiRoutes.enable();
uiRoutes
  .when('/', {
    template,
    resolve: {
      currentTime($http) {
        return $http.get('../api/kibana_csv_importer_plugin/example').then(function (resp) {
          return resp.data.time;
        });
      }
    }
  });

const app = uiModules.get('app/kibana_csv_importer_plugin', [
  'ngFileUpload'
]);

app.controller('FileUploadCtrl', ['$scope', '$injector', ($scope, $injector) => {
  const $timeout = $injector.get('$timeout');
  const $http = $injector.get('$http');
  const Upload = $injector.get('Upload');

  // vm = view model
  $scope.vm = {
    allPods: []
  };

  let vm = $scope.vm;

  // fetch all pods
  $http.get(getAllPods).then((response) => {
    if (response.data.error) {
      throw new Error(response.data.error);
    }

    vm.allPods = response.data.body.pods;
  }).catch(onError);

  const resetVmState = () => {
    delete vm.showImportSuccessMessage;
  };

  vm.createNewPod = () => {
    resetVmState();
    vm.podCreationInProgress = true;
    $http.post(createPodUrl)
      .then((response) => {
        if (response.data.error) {
          throw new Error(response.data.error);
        }

        const newPodName = response.data.body.podName;

        vm.podName = newPodName;
        vm.allPods.unshift(newPodName);
      })
      .catch(onError)
      .finally(() => {
        vm.podCreationInProgress = false;
      });
  };

  vm.onFilesDrop = (files) => {
    vm.file = files[0];
  };

  vm.removeFile = () => {
    resetVmState();
    delete vm.file;
  };

  vm.onSubmit = () => {
    let fileName = _.get(vm.file, 'name', '');
    if (!fileName) {
      return;
    }

    fileName = fileName.split('.csv')[0].toLowerCase();

    vm.importInProgress = true;
    vm.showImportSuccessMessage = false;
    vm.errors = [];

    let counter = 0;
    Papa.parse(vm.file, {
      header: true,
      dynamicTyping: true,
      step: (row) => {
        const data = _.get(row, 'data[0]');
        return $http.post(importUrl, {
          podName: vm.podName,
          type: fileName,
          data: _.extend(data, {
            id: ++counter
          })
        }).then((response) => {
          if (response.data.error) {
            throw response.data.error;
          }
        }).catch((error) => {
          vm.errors.push(JSON.stringify(error, null, 2));
        });
      },
      complete: (results, file) => {
        console.log('Parsing complete:', results, file);
        $timeout(() => {
          vm.showImportSuccessMessage = vm.errors.length < 1;
          vm.importInProgress = false;
        }, 1000);
      },
      error: (error) => {
        vm.errors.push(JSON.stringify(error, null, 2));
      },
      skipEmptyLines: true
    });
  };
}]);
