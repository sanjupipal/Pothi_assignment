const UserReport = () => {
  var EventSource = require("eventsource");
  var url = "https://stream.wikimedia.org/v2/stream/revision-create";

  var eventSource = new EventSource(url);

  eventSource.onerror = function (event) {
    console.error("--- Encountered error", event);
  };

  const oneMinuteMap = {};
  let currLogForOneMinute = null;

  const handleUserOneMinReport = (event, minute) => {
    if (!currLogForOneMinute) {
      currLogForOneMinute = minute;
    }
    if (!oneMinuteMap[minute]) {
      oneMinuteMap[minute] = new Map();
    }
    user = oneMinuteMap[minute];
    if (
      event.meta.domain == "en.wikipedia.org" &&
      !event.performer.user_is_bot
    ) {
      if (user.has(event.performer.user_text)) {
        user[event.performer.user_text] = Math.max(
          user.get(event.performer.user_text),
          event.performer.user_edit_count
        );
      } else {
        if (event.performer.user_edit_count) {
          user.set(event.performer.user_text, event.performer.user_edit_count);
        }
      }
    }
  };
  eventSource.onmessage = (event) => {
    event = JSON.parse(event.data);
    minute = new Date().getMinutes();
    handleUserOneMinReport(event, minute);
  };

  const generateOneMinReport = () => {
    user = oneMinuteMap[currLogForOneMinute];
    const mapSort1 = new Map([...user.entries()].sort((a, b) => b[1] - a[1]));
    user.clear();
    console.log("Users who made changes to en.wikipedia.org");
    mapSort1.forEach((k, v) => {
      console.log(`${v} : ${k}`);
    });
    delete oneMinuteMap[currLogForOneMinute];
    currLogForOneMinute += 1;
    if (currLogForOneMinute == 60) {
      currLogForOneMinute = 0;
    }
  };
  setInterval(() => {
    console.log(
      "\n ============================ One Min User Report ============================ \n"
    );
    generateOneMinReport();
  }, 60 * 1000);
};

module.exports = UserReport;
