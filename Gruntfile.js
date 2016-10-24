module.exports = function(grunt) {

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		less: {
      development: {
        options: {
          compress: true,
          yuicompress: true,
          optimization: 2
        },
        files: [{
          src: [
            './main.less'
          ],
          dest: './',
          expand: true,
          rename: function(dest, src) {
            return dest + src.match(/\/([^/]*)$/)[1].replace('.less', '.css');
          }
        }]
      }
    },

		watch: {
			less: {
				files: './*.less',
				tasks: [ 'less' ]
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-less');

	grunt.registerTask('default', ['watch']);

};
