var gulp = require("gulp"),
  browserSync = require("browser-sync").create(),
  sass = require('gulp-sass'),
  notify = require('gulp-notify'),
  minifyCss = require('gulp-minify-css'),
  rename = require('gulp-rename'),
  autoprefixer = require('gulp-autoprefixer'),
  del = require("del"),
  gutil = require("gulp-util"),
  concatCss = require("gulp-concat-css"),
  gulpif = require("gulp-if"),
  uglify = require("gulp-uglify"),
  imagemin = require("gulp-imagemin"),
  uncss = require('gulp-uncss'),
  filter = require("gulp-filter"),
  ftp = require("vinyl-ftp"),
  wiredep = require("wiredep").stream,
  useref = require("gulp-useref"),
  size = require("gulp-size"),
  compass = require('gulp-compass'),
  plumber = require('gulp-plumber'),
  spritesmith = require('gulp.spritesmith'),
  // До выхода gulp 4 версии временное решение
  //runSequence = require('run-sequence'),
  RS_CONF = require('./rs-conf.js');



// * ====================================================== * 
//   DEV
// * ====================================================== * 


// sass
// ******************************************************
gulp.task("sass", function () {
  return gulp.src(RS_CONF.path.scssСonnect)
    .pipe(sass())
    .pipe(gulp.dest(RS_CONF.path.cssDirDest))
    .pipe(browserSync.stream())
    .pipe(notify("Scss"));
});

// autoprefixer
// ******************************************************
gulp.task('autoprefixer', function () {
  return gulp.src(RS_CONF.path.cssDir)
    .pipe(autoprefixer({
      browsers: ['last 6 versions', "ie 8"],
      cascade: false
    }))
    .pipe(gulp.dest(RS_CONF.path.cssDirDest));
});

// wiredep
// ******************************************************
gulp.task("wiredep-bower", function () {
  return gulp.src(RS_CONF.path.htmlDir)
    .pipe(wiredep({
      directory: RS_CONF.path.bowerDir,
      overrides: {
        "qtip2": {
          "main": ["./jquery.qtip.min.js", "./jquery.qtip.min.css"],
          "dependencies": {
            "jquery": ">=1.6.0"
          }
        }/*,
        "bootstrap": {
          "main": ["dist/js/bootstrap.min.js", "dist/css/bootstrap.css"]  // подключение bootstrap в html
        }*/
      },
      exclude: ["bower/modernizr/"],
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest(RS_CONF.path.baseDir));
});

// spritesmith
// ******************************************************
gulp.task('sprite', function () {
  var spriteData = gulp.src(RS_CONF.path.spriteDir)
    .pipe(spritesmith({
      imgName: 'sprite.png',
      cssName: '_sprite.scss',
      cssFormat: 'scss',
      padding: 10,
      algorithm: 'top-down'
      //cssTemplate: './custom.scss.template.handlebars',
      //cssVarMap: function (sprite) {
      //  sprite.name = 's-' + sprite.name
      //}
    }));
  //spriteData.img.pipe(gulp.dest(path.src.srcImg()));
  //spriteData.css.pipe(gulp.dest(path.src.scss() + "utilities/"));
  return spriteData.pipe(gulp.dest(RS_CONF.path.imgDestDir));
});

// scss-compass
// ******************************************************
gulp.task('compass', function () {
  gulp.src(RS_CONF.path.scssDir)
    .pipe(plumber())
    .pipe(compass({
      config_file: RS_CONF.path.compassConfig,
      css: RS_CONF.path.cssDirDest,
      sass: RS_CONF.path.scssDirDest,
      image: RS_CONF.path.iconDir
    }));
});

// browsersync front-end
// ******************************************************
gulp.task("server", ["compass", "autoprefixer", "wiredep-bower"], function () {

  browserSync.init({
    port: 9000,
    open: false,
    notify: false,
    server: {
      baseDir: RS_CONF.path.baseDir
    }
  });
//  для компиляции можно использовать saas или compass
//  compass хорошо создает спрайты
  //gulp.watch(RS_CONF.path.scssDir, ["sass"]); 
  gulp.watch(RS_CONF.path.scssDir, ["compass"]);
  gulp.watch("bower.json", ["wiredep-bower"]);
  gulp.watch(RS_CONF.path.cssDir, ["autoprefixer"]).on("change", browserSync.reload);
  gulp.watch(RS_CONF.path.htmlDir).on("change", browserSync.reload);
  gulp.watch(RS_CONF.path.jsDir).on("change", browserSync.reload);

});

// browsersync local-host
// ******************************************************
gulp.task("local-host", ["compass", "autoprefixer", "wiredep-bower"], function () {

  browserSync.init({
        proxy: "projectName/app"
    });

//  для компиляции можно использовать saas или compass
//  compass хорошо создает спрайты
  //gulp.watch(RS_CONF.path.scssDir, ["sass"]); 
  gulp.watch(RS_CONF.path.scssDir, ["compass"]);
  gulp.watch("bower.json", ["wiredep-bower"]);
  gulp.watch(RS_CONF.path.cssDir, ["autoprefixer"]).on("change", browserSync.reload);
  gulp.watch(RS_CONF.path.htmlDir).on("change", browserSync.reload);
  gulp.watch(RS_CONF.path.jsDir).on("change", browserSync.reload);

});

// default
// ******************************************************
gulp.task("default", ["server"]);

// local
// ******************************************************
gulp.task("local", ["local-host"]);

var log = function (error) {
  console.log([
        "",
        "----------ERROR MESSAGE START----------",
    ("[" + error.name + " in " + error.plugin + "]"),
        error.message,
        "----------ERROR MESSAGE END----------",
        ""
    ].join("\n"));
  this.end();
}


// * ====================================================== *
//   BUILD
// * ====================================================== *


// Переносим CSS JS HTML в папку DIST (useref)
// ******************************************************
gulp.task("useref", function () {
  var assets = useref.assets();
  return gulp.src(RS_CONF.path.htmlDir)
    .pipe(assets)
    .pipe(gulpif("*.js", uglify()))
    .pipe(gulpif("*.css", minifyCss({
      compatibility: "ie8"
    })))
    .pipe(assets.restore())
    .pipe(useref())
    .pipe(gulp.dest(RS_CONF.path.distDir));
});

// Очищаем директорию DIST
// ******************************************************
gulp.task("clean-dist", function () {
  return del(RS_CONF.path.distDelDir);
});

// Запускаем локальный сервер для DIST
// ******************************************************
gulp.task("dist-server", function () {
  browserSync.init({
    port: 2000,
    open: false,
    notify: false,
    server: {
      baseDir: RS_CONF.path.distDir
    }
  });
});

// Перенос шрифтов
// ******************************************************
gulp.task("fonts", function () {
  gulp.src(RS_CONF.path.fontsDir)
    .pipe(filter(["*.eot", "*.svg", "*.ttf", "*.woff", "*.woff2"]))
    .pipe(gulp.dest(RS_CONF.path.distFontsDir))
});

// Перенос картинок
// ******************************************************
gulp.task("images", function () {
  return gulp.src(RS_CONF.path.imgDir)
    .pipe(imagemin({
      progressive: true,
      interlaced: true
    }))
    .pipe(filter(["*.jpg", "*.svg", "*.jpeg", "*.png", "*.webp", "*.gif", "!/icons"]))
    .pipe(gulp.dest(RS_CONF.path.distImgDir));
});

// Перенос остальных файлов (favicon и т.д.)
// ******************************************************
gulp.task("extras", function () {
  return gulp.src(RS_CONF.path.extraFiles)
    .pipe(gulp.dest(RS_CONF.path.distDir));
});

// Вывод размера папки APP
// ******************************************************
gulp.task("size-app", function () {
  return gulp.src(RS_CONF.path.allAppFiles).pipe(size({
    title: "APP size: "
  }));
});

// Сборка и вывод размера папки DIST
// ******************************************************
gulp.task("dist", ["useref", "images", "fonts", "extras", "size-app"], function () {
  return gulp.src(RS_CONF.path.allDistFiles).pipe(size({
    title: "DIST size: "
  }));
});

// Собираем папку DIST - только когда файлы готовы
// ******************************************************
gulp.task("build", ["clean-dist", "wiredep-bower"], function () {
  gulp.start("dist");
});


// * ====================================================== *
//   DEPLOY
// * ====================================================== *


// Отправка проекта на сервер
// ******************************************************
gulp.task("deploy", function () {
  var conn = ftp.create({
    host: RS_CONF.conn.host,
    user: RS_CONF.conn.user,
    password: RS_CONF.conn.password,
    parallel: 10,
    log: gutil.log
  });

  return gulp.src(RS_CONF.conn.src, {
      base: RS_CONF.conn.base,
      buffer: false
    })
    .pipe(conn.dest(RS_CONF.conn.folder));
});





// * ====================================================== *
//   Резерв
// * ====================================================== *

// uncss неработает пока
// ******************************************************
gulp.task('uncss', function () {
  return gulp.src('app/css/style.min.css')
    .pipe(uncss({
      html: ['app/**/*.html']
    }))
    .pipe(gulp.dest('app/css/style.min.css'));
});