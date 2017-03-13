describe('Admin - Fan Interaction', function() {
  var adminBrowser = browser;
  var paths = {
    fan:        '/show/fan_new_event',
    login:      '/login',
    admin:      '/admin',
    host:       '/host',
    firstEvent: '/admin/events/112'
  };

  var username = 'admin';
  var password = 'admin';
  var EC = protractor.ExpectedConditions;
  var fanBrowser;
  var hostBrowser;

  it('set up global variables', function() {
    fanBrowser  = adminBrowser.forkNewDriverInstance();
    //hostBrowser = adminBrowser.forkNewDriverInstance();

    fanBrowser.manage().window().setSize(1600, 1000);
    //hostBrowser.manage().window().setSize(1600, 1000);

    fanBrowser.ignoreSynchronization  = true;
    //hostBrowser.ignoreSynchronization = true;
  });

  describe('fan to admin interaction', function() {
    var fanText;
    var fanList;
    var getInLineBtn;
    var fanNameInput;
    var adminActions;
    var toggleConnectBtn;
    var adminBoxInFanScreen;
    var fanBoxInAdminScreen;

    it('sets up the admin screen', function() {
      adminBrowser.get(paths.firstEvent);
      fanList             = adminBrowser.element(by.css('#fan_list'));
      fanBoxInAdminScreen = adminBrowser.element(by.css('#userBox'));
    });

    it('puts the fan in line', function() {
      fanBrowser.get(paths.fan);
      //
      getInLineBtn        = fanBrowser.element(by.css('#get-in-line'));
      fanNameInput        = fanBrowser.element(by.css('#fan-name'));
      adminBoxInFanScreen = fanBrowser.element(by.css('#hostBox'));
      connectedIndicator  = fanBrowser.element(by.css('.session-connected'));
      
      expect(getInLineBtn.waitReady(null, fanBrowser)).toBeTruthy();
      expect(fanNameInput.waitReady(null, fanBrowser)).toBeTruthy();
      
      fanNameInput.sendKeys('test');
      
      fanBrowser.sleep(1000);
      getInLineBtn.click();

      fanBrowser.sleep(25000);
      fanBrowser.sleep(2000);
      expect(connectedIndicator.isDisplayed()).toBe(true);
      expect(adminBrowser.element.all(by.css('#fan_list ol li')).count()).toBe(1);
    });

    it('allows the admin to connect to the fan', function() {
      adminActions     = adminBrowser.element(by.css('#fan_list ol li'));
      toggleConnectBtn = adminActions.element(by.css('.toggle-connect-fan'));

      adminBrowser.sleep(1000);
      fanBrowser.sleep(1000);
      toggleConnectBtn.click();

      adminBrowser.sleep(10000);
      fanBrowser.sleep(10000);

      expect(fanBoxInAdminScreen.element(by.css('.OT_subscriber:not(.OT_loading) video')).isPresent()).toBe(true);
      expect(adminBoxInFanScreen.element(by.css('.OT_subscriber:not(.OT_loading) video')).isPresent()).toBe(true);
      expect(toggleConnectBtn.getText()).toBe('Disconnect');
    });

    it('allows the admin to disconnect from the fan', function() {
      adminBrowser.sleep(1000);
      fanBrowser.sleep(1000);
      toggleConnectBtn.click();

      adminBrowser.sleep(10000);
      fanBrowser.sleep(10000);

      expect(fanBoxInAdminScreen.element(by.css('.OT_subscriber:not(.OT_loading) video')).isPresent()).toBe(false);
      expect(adminBoxInFanScreen.element(by.css('.OT_subscriber:not(.OT_loading) video')).isPresent()).toBe(false);
      expect(toggleConnectBtn.getText()).toBe('Connect');
    });
  });

  it('cleans up', function() {
    fanBrowser.quit();
    adminBrowser.quit();
    //hostBrowser.close();
  });
});
