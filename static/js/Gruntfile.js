module.exports = function (grunt) {
    var transport = require('grunt-cmd-transport');
    var style = transport.style.init(grunt);
    var text = transport.text.init(grunt);
    var script = transport.script.init(grunt);

    grunt.initConfig({
        pkg : grunt.file.readJSON("package.json"),

        transport : {
            options : {
                paths : ['src'],
                parsers : {
                    '.js' : [script.jsParser],
                    '.css' : [style.css2jsParser],
                    '.html' : [text.html2jsParser]
                },
                alias: {
                    "jquery": "common/jquery_1_11_1"
                }
            },

            demoshower : {
            	options: {
                    idleading: ''
                },
                files : [
                    {
                    	expand: true,
                        cwd : 'src',
                        src : '**/*.js',
                        filter : 'isFile',
                        dest : '.build'
                    }
                ]
            }
        },
        concat : {
            options : {
                paths : ['.build'],
                include : 'all'
            },
    
            demoshower : {
                files: [
                    {
                        expand: true,
                        cwd: '.build',
                        src: ['demoshower/*.js'],
                        dest: 'min',
                        ext: '.js'
                    }
                ]
            },

            common : {
                files: [
                    {
                        expand: true,
                        cwd: '.build',
                        src: ['common/jquery_1_11_1.js'],
                        dest: 'min',
                        ext: '.js'
                    }
                ]
            }
        },

        uglify : {
            demoshower : {
                files: [
                    {
                        expand: true,
                        cwd: 'min',
                        src: ['demoshower/*.js', '!demoshower/*-debug.js', 'common/*.js'],
                        dest: 'min',
                        ext: '.js'
                    }
                ]
            }
        },

        clean : {
            spm : ['.build']
        }
    });

    grunt.loadNpmTasks('grunt-cmd-transport');
    grunt.loadNpmTasks('grunt-cmd-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['transport:demoshower', 'concat:demoshower', 'concat:common', 'uglify:demoshower', 'clean']);
//    grunt.registerTask('default', ['clean']);
};