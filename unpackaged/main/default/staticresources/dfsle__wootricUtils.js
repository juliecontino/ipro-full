/**
 * Wootric utility functions.
 * @namespace wootricUtils
 */

window.wootricUtils = (function () {

var displaySurvey = function (value, userIdHash) {
  window.wootricSettings = {          
    account_token: 'NPS-eb3a34d0',   
    // Check this link for more details: https://docs.wootric.com/javascript/#installing-javascript-sdk
    email: userIdHash, // can send either email or any unique identifier
    properties: {
      environment: value,
    }
  };
  window.wootric('run');
};

return Object.freeze({
  displaySurvey: displaySurvey,
});
}());
