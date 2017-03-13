module.exports = function(grunt) {
    require('jit-grunt')(grunt);
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        less: {
            development: {
                files: {
                    "public/stylesheets/root.css": "public/stylesheets/root.less" // destination file and source file
                }
            }
        },
        react: {
          dynamic_mappings: {
            files: [
              {
                expand: true,
                cwd: 'app/',
                src: ['**/*.jsx'],
                dest: 'build',
                ext: '.js'
              }
            ]
          }
        },
        copy: {
          main: {
            expand: true,
            src: '**',
            cwd: 'app/',
            dest: 'build/',
          },
        },
        browserify: {
            dev: {
                options: {
                    debug: true,
                    transform: [require('grunt-react').browserify, 'reactify']
                },
                files: {
                    'public/javascripts/bundle.dev.js': ['build/bootstrap.js']
                }
            },
            min: {
                options: {
                    transform: [require('grunt-react').browserify, 'reactify']
                },
                files: {
                    'public/javascripts/bundle.min.js': ['build/bootstrap.js']
                }
            },
            widget: {
                options: {
                    transform: [require('grunt-react').browserify, 'reactify']
                },
                files: {
                    'public/javascripts/widget.js': ['app/fan/embedWidget.js']
                }
            },
        },
        uglify: {
            build: {
                src: 'public/javascripts/bundle.min.js',
                dest: 'public/javascripts/bundle.min.js'
            }
        },
        watch: {
            styles: {
                files: ['public/stylesheets/root.less','public/stylesheets/less/*.less'], // which files to watch
                tasks: ['less'],
                options: {
                    livereload: true
                }
            },
            browserify: {
                files: ['build/**/*.js'],
                tasks: ['browserify:dev'],
                options: {
                    nospawn: true
                }
            },
            react: {
                files: ['app/**/*.js'],
                tasks: ['react', 'copy']
            }
        },
        nodemon: {
            dev: {
                script: 'server.js',
                options: {
                    args: ['dev'],
                    nodeArgs: ['--debug'],
                    callback: function (nodemon) {
                        nodemon.on('log', function (event) {
                            console.log(event.colour);
                        });
                    },
                    env: {
                        PORT: '3000'
                    },
                    watch: ['server'],
                    delay: 1000,
                    legacyWatch: true
                }
            },
            exec: {
                options: {
                    exec: 'less'
                }
            }
        },
        'node-inspector': {
            custom: {
                options: {
                    'web-host': 'localhost',
                    'web-port': 3000,
                    'debug-port': 5858,
                }
            }
        },
        concurrent: {
            target: {
                tasks: ['less', 'nodemon', 'watch', 'copy'],
                options: {
                    logConcurrentOutput: true
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-react');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-node-inspector');

    grunt.registerTask('default', ['concurrent:target']);
    grunt.registerTask('build', ['less', 'copy', 'react', 'browserify:min', 'uglify']);
};
