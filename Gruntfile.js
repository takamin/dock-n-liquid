module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        browserify: {
            target: {
                files: {
                    "./dock-n-liquid.js": [ "./index.js" ]
                }
            }
        },
        uglify: {
            target: {
                files: {
                    "./dock-n-liquid.min.js" : [ "./dock-n-liquid.js" ]
                }
            }
        },
        eslint: {
            files: [
                './index.js'
            ]
        }
    });

    grunt.loadNpmTasks("grunt-browserify");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.registerTask('lint', [ "eslint"]);
    grunt.registerTask("default", [ "lint", "browserify", "uglify" ]);
};
