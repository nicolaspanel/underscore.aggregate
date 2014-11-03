'use strict';

var coreFiles = [ 'underscore.aggregate.js' ];
var confFiles = [
    'gruntfile.js',
    'karma.conf.js'
];
var specFiles= [ 'specs/*.spec.js' ];


module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            filesSrc: ['underscore.aggregate.min.js']
        },
        uglify: {
            options: {
                banner: '' +
                    '/* \n' +
                    '<%= pkg.name %>#<%= pkg.version %> \n' +
                    'Copyright (C) Nicolas Panel <%= grunt.template.today("yyyy") %> \n'+
                    'MIT license \n' +
                    '*/ \n'
          },
          full: {
            files: {
              'underscore.aggregate.min.js': coreFiles
            }
          }
        },
        jshint: {
            all: {
                src: coreFiles.concat(confFiles).concat(specFiles),
                options: {
                    jshintrc: true
                }
            }
        },
        karma: {
            default: {
                configFile: './karma.conf.js'
            }
        }
    });

    // loading the required tasks
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-git-tag');


    grunt.registerTask('test', ['jshint:all', 'karma:default']);
    grunt.registerTask('release', ['test', 'uglify']);
    grunt.registerTask('default', ['test']);
};