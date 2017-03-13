var formInputObject = require('../utils/formInputObject');

describe('Admin', function() {
  var paths = {
    login:      '/login',
    admin:      '/admin',
    host:       '/host',
    newEvent:   '/admin/events/new',
    firstEvent: '/admin/events/108'
  };

  var username = 'admin';
  var password = 'admin';
  var EC = protractor.ExpectedConditions;

  describe('admin login flow', function() {

    beforeEach(function() {
      browser.get(paths.login);
    });

    it('prevents log in with invalid credentials', function() {

    });

    it('logs in correctly', function() {
      var isClickable;

      expect($('#username').waitReady()).toBeTruthy();
      expect($('#password').waitReady()).toBeTruthy();

      $('#username').sendKeys(username);
      $('#password').sendKeys(password);

      browser.sleep(1000);

      $('#sign-in').click();

      expect($('.panel-dashboard').waitReady()).toBeTruthy();
      expect(browser.getCurrentUrl()).toBe(browser.baseUrl + paths.admin);
    });
  });

  describe('clicks Add New Event button', function() {
    beforeEach(function() {
      browser.get(paths.admin);
      browser.sleep(1000);
    });

    it('renders the add new event screen', function() {        
      $('#new-event').click();
      expect(browser.getCurrentUrl()).toBe(browser.baseUrl + paths.newEvent);
    });
  });

  describe('New Event Screen', function() {
    describe('Save Button', function() {
      var saveBtn;
      var field;

      beforeEach(function() {
        browser.get(paths.newEvent);
        saveBtn = $('#save-event');
        field = $('#input-event-name');
        expect(saveBtn.waitReady()).toBeTruthy();
      });

      it('starts disabled', function() {
        browser.sleep(1000);
        expect(saveBtn.getAttribute('disabled')).toBeTruthy();
      });

      it('becomes enabled if name is specified', function() {
        $('#input-event-name').sendKeys('some text');

        browser.sleep(1000);
        expect(saveBtn.getAttribute('disabled')).toBe(null);
      });

      it('becomes disabled if name is erased', function() {
        field.sendKeys(protractor.Key.chord(protractor.Key.CONTROL, 'A'));
        field.sendKeys(protractor.Key.BACK_SPACE);
        field.clear();

        browser.sleep(1000);

        expect(saveBtn.getAttribute('disabled')).toBeTruthy();
      });
    });

    describe('DatePicker', function() {
      var datePicker;

      beforeEach(function() {
        browser.get(paths.newEvent);
        datePicker = $('#date_picker');
        expect(datePicker.waitReady()).toBeTruthy();
      });

      it('shows a date picker when clicked', function() {
        browser.sleep(1000);
        datePicker.click();
        browser.sleep(1000);

        expect($('.daterangepicker').isDisplayed()).toBe(true);
      });
    });
  });

  describe('admin edit event flow', function() {

  });

  describe('admin event view', function() {
    var fanList;

    it('set up variables for host view', function() {
      browser.get(paths.firstEvent);
      browser.sleep(100);
    });
  });
});