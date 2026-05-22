/**
 * Karma configuration — Angular 19
 * Run with: ng test
 * No additional packages needed beyond standard Angular CLI install.
 */
module.exports = function (config) {
  config.set({
    basePath: '',

    // Jasmine is the assertion + spec framework
    frameworks: ['jasmine', '@angular-devkit/build-angular'],

    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],

    client: {
      jasmine: {
        // Randomise test order to catch order-dependent bugs
        random: true,
      },
      clearContext: false, // keep Jasmine HTML runner output visible
    },

    jasmineHtmlReporter: {
      suppressAll: true, // removes duplicated traces
    },

    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [
        { type: 'html'  },  // browseable HTML report
        { type: 'text'  },  // terminal summary
        { type: 'lcovonly' }, // CI-compatible
      ],
      // Build fails if coverage drops below these
      check: {
        global: {
          statements: 85,
          branches:   80,
          functions:  85,
          lines:      85,
        },
      },
    },

    reporters: ['progress', 'kjhtml'],

    // Use headless Chrome in CI — no display needed
    browsers: ['ChromeHeadless'],

    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu'],
      },
    },

    restartOnFileChange: true,
  });
};
