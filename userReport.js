const UserReport = () => {
  var EventSource = require("eventsource");
  var url = "https://stream.wikimedia.org/v2/stream/revision-create";

  console.log(`Connecting to EventStreams at ${url}`);
  var eventSource = new EventSource(url);

  eventSource.onopen = function (event) {
    console.log("--- Opened connection.");
  };

  eventSource.onerror = function (event) {
    console.error("--- Encountered error", event);
  };

  const user = new Map();
  eventSource.onmessage = function (event) {
    event = JSON.parse(event.data);
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

  const generateReport = () => {
    const mapSort1 = new Map([...user.entries()].sort((a, b) => b[1] - a[1]));
    user.clear();
    console.log(
      "\x1b[36m%s\x1b[0m",
      "Users who made changes to en.wikipedia.org"
    );
    mapSort1.forEach((k, v) => {
      console.log("\x1b[32m", `${v} : ${k}`);
    });
  };

  setInterval(() => {
    console.log(
      "\x1b[33m",
      "\n ============================ One Min User Report ============================ \n"
    );
    generateReport();
  }, 60000);
};

module.exports = UserReport;
