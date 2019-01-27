var gulp 		= require('gulp');
var watch 		= require('node-watch');
var less 		= require('gulp-less');
var combiner 	= require('stream-combiner2');
var os 			= require('os');
let cleanCSS 	= require('gulp-clean-css');
var execSync 	= require('child_process').execSync;
let fs 			= require('fs');

function taskError(e) {
	console.error(e);
}

function taskCSS(errorCallback = false, successCallback=false){
	return combiner.obj([
		gulp.src('./app/stylesheets/less/main.less'),
		less(),
		cleanCSS(),
		gulp.dest('./app/stylesheets')
	]).on('error', console.error.bind(console));
}

function taskWatch() {
	watch('./app/stylesheets/less', { recursive: true }, function(evt, name) {
		console.log(`Updated: ${name}`);
		taskCSS()
	});
}

function taskBuildLinux() {

	if (os.platform() !== 'linux') {
		taskError("Try this command again while you're in linux chief.");
		return;
	}

	let version = 0;
	let unstable = '';

	console.log('Transforming LESS Files');
	taskCSS();

	const versionFile = fs.openSync('app/version', 'r');
	version = fs.readFileSync(versionFile, 'UTF-8');
	fs.closeSync(versionFile);

	// Any version not whole is unstable.
	if (parseFloat(version) % 1) {
		unstable = '-unstable';
	}

	console.log('Cleaning Artifacts');
	execSync('rm -Rfv ./dist/');
	console.log('Building Package');
	execSync('yarn build');
	execSync('mv ./dist/linux-unpacked ./dist/open-joystick-display');
	console.log('Copying Icon');
	execSync('cp ./app/icons/icon.png ./dist/open-joystick-display/icon.png');
	console.log('Compressing Package');
	execSync(`tar czvf ./dist/open-joystick-display-${version}${unstable}-linux.tar.gz -C ./dist open-joystick-display`);

}

function taskBuildWindows() {
	if (os.platform() !== 'win32') {
		taskError("Try this command again while you're in windows chief.");
		return;
	}


}

gulp.task('default', function(cb) {
	taskWatch();
	cb();
});

gulp.task('build-linux', function(cb) {
	taskBuildLinux();
	cb();
});

gulp.task('build-windows', function(cb) {
	taskBuildWindows();
	cb();
});