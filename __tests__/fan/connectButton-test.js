jest.dontMock('./../../app/fan/connectButton.js');

var React         = require('react/addons');
var ConnectButton = require('./../../app/fan/connectButton');
var AjaxHandler   = require('./../../app/common/ajax-handler');
var MockedData    = require('./../../__mocks__/mocked-data');
var OT            = require.requireActual('./../../__mocks__/opentok');
var Session       = require.requireActual('./../../__mocks__/ot-session');
var Publisher     = require.requireActual('./../../__mocks__/ot-publisher');
var TestUtils     = React.addons.TestUtils;

describe('ConnectButton', function() {
  var buttonElement, url, stats;

  beforeEach(function() {
    url = '/create_session';
    buttonElement = TestUtils.renderIntoDocument(<ConnectButton source='/create_session' OT={OT}/>);
  });

  it('starts with a Get In Line text', function() {
    expect(buttonElement.state.btnText).toEqual("Get In Line");
  });

  it('calls onGetInLineClick on click', function() {
    var button = TestUtils.findRenderedDOMComponentWithTag(buttonElement, 'button');
    buttonElement.onGetInLineClick = jest.genMockFunction();
    TestUtils.Simulate.click(button);

    expect(buttonElement.onGetInLineClick.mock.calls.length).toBe(1);
  });

  describe('.onGetInLineClick', function() {
    it('requests the session data to the server', function() {
      var handler = new AjaxHandler();
      handler.getRequest = jest.genMockFunction().mockImplementation(function(url, success, error) {
        success(MockedData.sessionData)
      });
      buttonElement.ajaxHandler = handler;
      buttonElement.testConnection = jest.genMockFunction();

      var button = TestUtils.findRenderedDOMComponentWithTag(buttonElement, 'button');
      TestUtils.Simulate.click(button);
      expect(handler.getRequest.mock.calls.length).toBe(1);
    });
  });

  describe(".testConnection", function() {
    beforeEach(function() {
      sessionData = MockedData.sessionData;
      session = new Session(sessionData.apiKey, sessionData.sessionId);
      publisher = new Publisher();

      OT.initSession = jest.genMockFunction().mockReturnValue(session);
      OT.initPublisher = jest.genMockFunction().mockReturnValue(publisher);
    });

    it('invokes OT.initSession', function() {
      buttonElement.testConnection(MockedData.sessionData, function() {});
      expect(OT.initSession).toBeCalled(1);
    });

    it('calls testNetwork on the session object', function() {
      var mockedTestNetwork = jest.genMockFunction();
      OT.initSession = jest.genMockFunction().mockImplementation(function() {
        return { testNetwork: mockedTestNetwork }
      });
      buttonElement.testConnection(MockedData.sessionData, function() {});
      expect(mockedTestNetwork.mock.calls.length).toBe(1);
    });
  });

  describe('.analyzeQualityStats', function() {
    beforeEach(function() {
      stats = {
        packetLossRatio: 0,
        downloadBitsPerSecond: 1234245,
        roundTripTimeMilliseconds: 210,
        uploadBitsPerSecond: 624540
      };
    });

    it('returns a JSON with resolution and quality', function() {
        var result = buttonElement.analyzeQualityStats(MockedData.testNetworkData);
        expect(result.quality).toBeDefined();
    });

    it('returns quality Poor if huge packet loss', function() {
        stats.packetLossRatio = 0.1;
        var result = buttonElement.analyzeQualityStats(stats);
        expect(result.quality).toBe('Poor');
    });

    it('returns quality Great when upload speed > 350kbps', function() {
      stats.uploadBitsPerSecond = 650 * 1000;
      var result = buttonElement.analyzeQualityStats(stats);
      expect(result.quality).toBe('Great');
    });
  });

  describe('.onConnectionTested', function() {
    it('invokes startSession', function() {
      buttonElement.startSession = jest.genMockFunction();
      buttonElement.onConnectionTested(null, stats);
      expect(buttonElement.startSession).toBeCalled(1);
    });
  });

  describe('.startSession', function() {
    beforeEach(function() {
      sessionData = MockedData.sessionData;
      session = new Session(sessionData.apiKey, sessionData.sessionId);
      session.on = jest.genMockFunction();
      OT.initSession = jest.genMockFunction().mockReturnValue(session);
      buttonElement.sendSignal = jest.genMockFunction();
    });

    it('subscribes to the streamDestroyed event', function() {
      buttonElement.startSession();
      expect(session.on).toBeCalledWith('streamDestroyed', buttonElement.onStreamDestroyed);
    });

    it('subscribes to the streamCreated event', function() {
      buttonElement.startSession();
      expect(session.on).toBeCalledWith('streamCreated', buttonElement.onStreamCreated);
    });

    it('connects to the session', function() {
      session.connect = jest.genMockFunction();
      buttonElement.state.data = MockedData.sessionData;
      buttonElement.startSession();
      expect(session.connect).toBeCalledWith(MockedData.sessionData.token, buttonElement.onConnectError);
    });

    it('changes the state text to Sending Signal', function() {
      buttonElement.startSession();
      expect(buttonElement.state.text).toBe('Sending Signal');
    });

    it('send the signal to the Producer', function() {
      buttonElement.startSession();
      expect(buttonElement.sendSignal).toBeCalled(1);
    });
  });
});
