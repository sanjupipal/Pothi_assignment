const UserReport = () => {
  var EventSource = require("eventsource");
  var url = "https://stream.wikimedia.org/v2/stream/revision-create";

  var eventSource = new EventSource(url);

  eventSource.onerror = function (event) {
    console.error("--- Encountered error", event);
  };

  eventSource.onmessage = (event) => {
    event = JSON.parse(event.data);
    handleUserOneMinReport(event);
  };

  const oneMinuteMap = {};
  let currLogForOneMinute = null;

  const handleUserOneMinReport = (event) => {
    minute = Math.floor(new Date().getTime() / (60 * 1000)); //epoch minutes
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

  const ans = new Map();
  const generateOneMinReport = () => {
    data = oneMinuteMap[currLogForOneMinute];
    if (oneMinuteMap[currLogForOneMinute - 5]) {
      firstBucket = oneMinuteMap[currLogForOneMinute - 5];
      firstBucket.forEach((cnt, user) => {
        ans.set(user, 0);
        for (let index = 1; index < 5; index++) {
          bucket = oneMinuteMap[currLogForOneMinute - 5 + index];
          if (bucket.has(user)) {
            ans.set(user, Math.max(ans.get(user), bucket.get(user)));
          }
        }
        if (ans.get(user) == 0) {
          ans.delete(user);
        }
      });
      oneMinuteMap.delete(currLogForOneMinute - 5);
    }
    data.forEach((cnt, user) => {
      if (ans.has(user)) {
        ans.set(user, Math.max(ans.get(user), cnt));
      } else {
        ans.set(user, cnt);
      }
    });

    const mapSort1 = new Map([...ans.entries()].sort((a, b) => b[1] - a[1]));
    console.log("Users who made changes to en.wikipedia.org");
    mapSort1.forEach((k, v) => {
      console.log(`${v} : ${k}`);
    });
    currLogForOneMinute += 1;
  };

  setInterval(() => {
    minute = Math.floor(new Date().getTime() / (60 * 1000)); //epoch minutes
    if (minute == currLogForOneMinute) {
      return;
    }
    console.log(
      "\n ============================ Five Min User Report ============================ \n"
    );
    generateOneMinReport();
  }, 60 * 1000);
};

module.exports = UserReport;
