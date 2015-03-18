﻿
angular.module('jwt2').controller('mainController', ['$scope', '$http', '$modal', '$q', 'jwtSvc', function (scope, http, modal, qService, jwtSvc) {

    toastr.options.extendedTimeOut = 1000;
    toastr.options.timeOut = 1000;
    toastr.options.fadeOut = 250;
    toastr.options.fadeIn = 250;
    toastr.options.positionClass = "toast-top-right";

    scope.jsModel = '';
    scope.htmlModel = '';
    scope.jsList = [];
    scope.jsFileName = '';
    scope.htmlList = [];
    scope.htmlFileName = '';
    scope.cssList = [];
    scope.jsEditor = null;
    scope.htmlEditor = null;
    setJsEditor(scope);
    setHtmlEditor(scope);
    setCssEditor(scope);

    //new style
    scope.dataMode = '';
    scope.itemValue = '';
    scope.items = [];
    scope.changeDataMode = function (val) {
        if (val !== scope.dataMode) {
            scope.items = [];
            scope.jsList = [];
            scope.htmlList = [];
            scope.cssList = [];
            if (val === 'Base') {
                scope.dataMode = val;
                scope.changeItemValue();
                return;
            }
            http.get('JwtEx/GetItems/?name=' + val)
            .success(function (res) {
                scope.items = res;
                scope.itemValue = '0';
                setEditorDefault();

            })
        }
        scope.dataMode = val;
    }
    scope.changeItemValue = function () {
        if (scope.itemValue === '0') { return; }
        http.get('JwtEx/GetItemDetail/?name={0}&mode={1}'.format(scope.items[scope.itemValue], scope.dataMode))
        .success(function (res) {
            scope.jsList = res.js;
            scope.htmlList = res.html;
            scope.cssList = res.css;
            setEditorDefault();
        });
    };
    scope.newWidget = function (name) {
        if (!name) return;
        createItem(name, 'Widgets');

    };
    scope.newComponent = function (name) {
        if (!name) return
        createItem(name, 'Components');
    };
    function createItem(name, mode) {
        overlay(1);
        http.get('JwtEx/IsExist/?name={0}&mode={1}'.format(name, mode))
        .success(function (res) {
            if (!res.exist) {
                http.get('JwtEx/CreateItem/?name={0}&mode={1}'.format(name, mode))
                .success(function (res) {
                    if (res.success) {
                        success('Successfully generated.');
                    }
                    else {
                        info(res.msg);
                    }
                    overlay(0);
                });
            }
            else {
                info('Already exist.');
                overlay(0);
            }
        });
    }
    function setEditorDefault() {
        scope.htmlEditor.setValue('');
        scope.jsEditor.setValue('');
        scope.cssEditor.setValue('');
        scope.jsFileName = '';
        scope.htmlFileName = '';
        scope.cssFileName = '';
    }
    //end of new style

    //tab_javascript

    scope.jsLoad = function (fileName) {
        scope.jsFileName = fileName;
        if (!fileName) { info('File name is required.'); return; }
        http.get('JwtEx/GetFileContent/?mode={0}&directoryName={1}&fileName={2}'.format(scope.dataMode, scope.items[scope.itemValue], fileName))
           .success(function (data) {
               AWAIT.jsLock = 0;
               scope.jsEditor.setValue(data.data);
               setTimeout(function () { AWAIT.jsLock = 1; }, 100);
               updateEditor(scope.jsFileName, data.locked, true);
           });

    }
    scope.saveJsFile = function () {
        if (!scope.jsFileName) { info('There is no file to be saved.'); return; }
        if (LOCK.jsLock) return;
        http.post('JwtEx/SaveFile', { mode: scope.dataMode, directoryName: scope.items[scope.itemValue], fileName: scope.jsFileName, content: scope.jsEditor.getValue() })
        .success(function (data) {
            if (data.isSuccess) {
                jwtSvc.unlock({ Category: scope.dataMode, Folder: scope.items[scope.itemValue], Name: scope.jsFileName });
                success('Saved successfully.');
                AWAIT.jsLock = 1;
            }
        });
    }
    //tab_html

    scope.htmlLoad = function (fileName) {
        scope.htmlFileName = fileName;
        if (!fileName) { info('File name is required.'); return; }
        http.get('JwtEx/GetFileContent/?mode={0}&directoryName={1}&fileName={2}'.format(scope.dataMode, scope.items[scope.itemValue], fileName))
           .success(function (data) {
               AWAIT.htmlLock = 0;
               scope.htmlEditor.setValue(data.data);
               setTimeout(function () { AWAIT.htmlLock = 1; }, 100);
               updateEditor(scope.htmlFileName, data.locked, true);
           });

    }
    scope.saveHtmlFile = function () {
        if (!scope.htmlFileName) { info('There is no file to be saved.'); return; }
        if (LOCK.htmlLock) return;
        http.post('JwtEx/SaveFile', { mode: scope.dataMode, directoryName: scope.items[scope.itemValue], fileName: scope.htmlFileName, content: scope.htmlEditor.getValue() })
        .success(function (data) {
            if (data.isSuccess) {
                jwtSvc.unlock({ Category: scope.dataMode, Folder: scope.items[scope.itemValue], Name: scope.htmlFileName });
                success('Saved successfully.');
            }
        });
    }

    //tab_css

    scope.cssLoad = function (fileName) {
        scope.cssFileName = fileName;
        if (!fileName) { info('File name is required.'); return; }
        http.get('JwtEx/GetFileContent/?mode={0}&directoryName={1}&fileName={2}'.format(scope.dataMode, scope.items[scope.itemValue], fileName))
           .success(function (data) {
               AWAIT.cssLock = 0;
               scope.cssEditor.setValue(data.data);
               setTimeout(function () { AWAIT.cssLock = 1; }, 100);
               updateEditor(scope.cssFileName, data.locked, true);
           });

    }
    scope.saveCssFile = function () {
        if (!scope.cssFileName) { info('There is no file to be saved.'); return; }
        if (LOCK.cssLock) return;
        http.post('JwtEx/SaveFile', { mode: scope.dataMode, directoryName: scope.items[scope.itemValue], fileName: scope.cssFileName, content: scope.cssEditor.getValue() })
        .success(function (data) {
            if (data.isSuccess) {
                jwtSvc.unlock({ Category: scope.dataMode, Folder: scope.items[scope.itemValue], Name: scope.cssFileName });
                success('Saved successfully.');
            }
        });
    }
    //signalR
    var LOCK = { jsLock: 0, htmlLock: 0, cssLock: 0 };
    var AWAIT = { jsLock: 0, htmlLock: 0, cssLock: 0 };
    scope.$on('newConnection', function (event, message) {
        info('Joined in Development');
    });
    scope.$on('removeConnection', function (event, message) {
        info('Disconnected from Development');
    });
    scope.$on('lockFile', function (event, file) {
        var folder = scope.items[scope.itemValue] ;
        if (scope.dataMode === file.Category) {
            if (file.Category === 'Base') {
                updateEditor(file.Name, true, false);
            }
            else if (file.Folder === folder) {
                updateEditor(file.Name, true, false);
            }
        }
    });
    scope.$on('unlockFile', function (event, file) {
        var folder = scope.items[scope.itemValue] ;
        if (scope.dataMode === file.Category ) {
            if (file.Category === 'Base') {
                updateEditor(file.Name, false, false);
            }
            else if (file.Folder === folder) {
                updateEditor(file.Name, false, false);
            }
        }
    });
    scope.jsChange = function () {        
        if (AWAIT.jsLock) {
            if(scope.jsEditor.getValue())
            jwtSvc.lock({ Category: scope.dataMode, Folder: scope.items[scope.itemValue] || 'base', Name: scope.jsFileName });
            AWAIT.jsLock = 0;
        }
    };
    scope.htmlChange = function () {
        if (AWAIT.htmlLock) {
            if (scope.htmlEditor.getValue())
            jwtSvc.lock({ Category: scope.dataMode, Folder: scope.items[scope.itemValue], Name: scope.htmlFileName });
            AWAIT.htmlLock = 0;
        }
    };
    scope.cssChange = function () {
        if (AWAIT.cssLock) {
            if (scope.cssEditor.getValue())
            jwtSvc.lock({ Category: scope.dataMode, Folder: scope.items[scope.itemValue], Name: scope.cssFileName });
            AWAIT.cssLock = 0;
        }
    };
    function updateEditor(fileName, readOnly, isFromLoadContent) {

        if (fileName === scope.jsFileName) {
            scope.jsEditor.options.readOnly = readOnly;
            LOCK.jsLock = readOnly;
            if (!LOCK.jsLock && !isFromLoadContent) { scope.jsLoad(fileName); info('Unlocked '+fileName); }
        }
        else if (fileName === scope.htmlFileName) {
            scope.htmlEditor.options.readOnly = readOnly;
            LOCK.htmlLock = readOnly;
            if (!LOCK.htmlLock && !isFromLoadContent) { scope.htmlLoad(fileName); info('Unlocked ' + fileName); }
        }
        else if (fileName === scope.cssFileName) {
            scope.cssEditor.options.readOnly = readOnly;
            LOCK.cssLock = readOnly;
            if (!LOCK.cssLock && !isFromLoadContent) { scope.cssLoad(fileName); info('Unlocked ' + fileName); }
        }
    }
    //end signalR
    
    function success(msg) {
        toastr['success'](msg);
    }
    function info(msg) {
        toastr['info'](msg);
    }
}]);


function setJsEditor(scope) {
    setTimeout(function () {
        scope.jsEditor = CodeMirror.fromTextArea(document.getElementById("jsEditor"), {
            lineNumbers: true,
            theme: 'rubyblue',
            lineWrapping: true,
            mode: { name: 'javascript', globalVars: true },
            matchBrackets: true,
            autoCloseBrackets: true,
            extraKeys: { "Ctrl-Space": "autocomplete", "Ctrl-S": function (ins) { scope.saveJsFile(); } },
            enableSearchTools: true,
            styleActiveLine: true

        });
        scope.jsEditor.on("change", scope.jsChange);
    }, 100);
}
function setHtmlEditor(scope) {
    setTimeout(function () {
        scope.htmlEditor = CodeMirror.fromTextArea(document.getElementById("htmlEditor"), {
            lineNumbers: true,
            theme: 'rubyblue',
            lineWrapping: true,
            mode: 'htmlmixed',
            matchBrackets: true,
            matchTags: { bothTags: true },
            autoCloseBrackets: true,
            autoCloseTags: true,
            enableSearchTools: true,
            styleActiveLine: true,
            extraKeys: { "Ctrl-Space": "autocomplete", "Ctrl-S": function (ins) { scope.saveHtmlFile(); } },
        });
        scope.htmlEditor.on("change", scope.htmlChange);
    }, 200);
}
function setCssEditor(scope) {
    setTimeout(function () {
        scope.cssEditor = CodeMirror.fromTextArea(document.getElementById("cssEditor"), {
            lineNumbers: true,
            theme: 'rubyblue',
            lineWrapping: true,
            mode: 'text/css',
            matchBrackets: true,
            matchTags: { bothTags: true },
            autoCloseBrackets: true,
            autoCloseTags: true,
            enableSearchTools: true,
            styleActiveLine: true,
            extraKeys: { "Ctrl-Space": "autocomplete", "Ctrl-S": function (ins) { scope.saveCssFile(); } },
        });
        scope.cssEditor.on("change", scope.cssChange);
    }, 300);
}
function overlay(val) {
    val ? $('.overlay').show() : $('.overlay').hide();
}