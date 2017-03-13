describe('Fan Flows', function() {
  var paths = { fan: '/show/fan_new_event' };

  describe('new fan appears', function() {
    var publisher;
    var getInLineBtn;
    var fanNameInput;
    var fanText;

    it('set up variable for fan view', function() {
      browser.get(paths.fan);
      publisher    = browser.element(by.css('.OT_publisher'));
      getInLineBtn = browser.element(by.css('#get-in-line'));
      fanNameInput = browser.element(by.css('#fan-name'));
      fanText      = browser.element(by.css('.fan-text'));
    });

    it('publishes the fan stream', function() {
      browser.sleep(1000);
      expect(publisher.isPresent()).toBe(true);
      expect(publisher.hasClass('OT_loading')).toBe(false);
    });

    it('allows the fan to get in line', function() {
      expect(fanNameInput.isDisplayed()).toBe(true);
      expect(getInLineBtn.isDisplayed()).toBe(true);
    });

    it('requires a fan name to be present', function() {
      var alertDialog;

      getInLineBtn.click();
      alertDialog = browser.switchTo().alert().then(function(alert) {
        alert.dismiss();
      }, function(err) {
        expect('Alert present').toBe(true);
      });
    });

    it('tests the connection', function() {
      expect(getInLineBtn.waitReady(null, browser)).toBeTruthy();
      expect(fanNameInput.waitReady(null, browser)).toBeTruthy();

      fanNameInput.sendKeys('test');
      getInLineBtn.click();

      browser.sleep(10000);

      expect(fanText.getText()).toBe('Testing your connection, please wait a few seconds.');
    });
  });
});