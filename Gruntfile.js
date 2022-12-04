module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %>' +
        ' - <%= pkg.homepage %>' +
        ' - (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>' +
        ' - licensed <%= pkg.license %> */\n',
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            gruntfile: {
                src: 'Gruntfile.js'
            },
            lib: {
                src: ['lib/**/*.js']
            },
            test: {
                src: ['test/**/*.js']
            }
        },
        browserify: {
            all: {
                src: '<%= pkg.main %>',
                dest: 'dist/<%= pkg.name %>.js',
                options: {
                    banner: '<%= banner %>',
                    browserifyOptions: {
                        standalone: 'np',
                        debug: true
                    },
                    configure: function(bundler) {
                        bundler.transform(require('babelify'), {
                            presets: ['@babel/preset-env']
                        });
                    }
                }
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            dist: {
                src: '<%= browserify.all.dest %>',
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },
        shell: {
            test: {
                command: 'qunit'
            },
        },
        jsdoc: {
            dist: {
                options: {
                    configure: './doc/conf.js',
                }
            }
        },
        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            lib: {
                files: '<%= jshint.lib.src %>',
                tasks: ['jshint:lib', 'shell:test', 'browserify', 'jsdoc']
            },
            test: {
                files: '<%= jshint.test.src %>',
                tasks: ['jshint:test', 'shell:test']
            }
        },
    });  // grunt.initConfig

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks("grunt-jsdoc");

    // Build a distributable release
    grunt.registerTask('dist', ['browserify', 'shell:test', 'uglify']);

    // Run test on source codes.
    grunt.registerTask('test', ['jshint', 'shell:test']);

    // By default, run test.
    grunt.registerTask('default', ['test']);
};
