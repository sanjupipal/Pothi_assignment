const UserReport = () => {
  var EventSource = require("eventsource");
  var url = "https://stream.wikimedia.org/v2/stream/revision-create";

  var eventSource = new EventSource(url);

  eventSource.onerror = function (event) {
    console.error("--- Encountered error", event);
  };

  const minutesMap = {};
  let currLogMinute = null;
  eventSource.onmessage = function (event) {
    event = JSON.parse(event.data);
    minute = new Date().getMinutes();
    minute = minute ? minute : 60;
    if (!currLogMinute) {
      currLogMinute = minute;
    }
    if (!minutesMap[minute]) {
      minutesMap[minute] = new Map();
    }
    user = minutesMap[minute];
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

  const generateOneMinReport = () => {
    user = minutesMap[currLogMinute];
    const mapSort1 = new Map([...user.entries()].sort((a, b) => b[1] - a[1]));
    user.clear();
    console.log("Users who made changes to en.wikipedia.org");
    mapSort1.forEach((k, v) => {
      console.log(`${v} : ${k}`);
    });
    delete minutesMap[currLogMinute];
    currLogMinute += 1;
    if (currLogMinute == 60) {
      currLogMinute = 1;
    }
  };

  setInterval(() => {
    console.log(
      "\n ============================ One Min User Report ============================ \n"
    );
    generateOneMinReport();
  }, 60000);
};

module.exports = UserReport;
