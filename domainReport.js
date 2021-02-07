const DomainReport = () => {
  var EventSource = require("eventsource");
  var url = "https://stream.wikimedia.org/v2/stream/revision-create";

  var eventSource = new EventSource(url);

  eventSource.onerror = function (event) {
    console.error("--- Encountered error", event);
  };

  const minuteMap = {};
  let currLogMinute = null;
  eventSource.onmessage = function (event) {
    minute = new Date().getMinutes();
    minute = minute ? minute : 60;
    if (!currLogMinute) {
      currLogMinute = minute;
    }
    if (!minuteMap[minute]) {
      minuteMap[minute] = new Map();
    }
    domain = minuteMap[minute];
    event = JSON.parse(event.data);
    if (domain.has(event.meta.domain)) {
      domain.get(event.meta.domain).add(event.page_id);
    } else {
      let page = new Set();
      page.add(event.page_id);
      domain.set(event.meta.domain, page);
    }
  };

  const generateOneMinReport = () => {
    domain = minuteMap[currLogMinute];
    let report = new Map();
    domain.forEach((k, v) => {
      report.set(v, k.size);
    });
    domain.clear();
    const mapSort1 = new Map([...report.entries()].sort((a, b) => b[1] - a[1]));
    let totalDomainUpdated = mapSort1.size;
    console.log(
      `total number of Wikipedia Domain Updated : ${totalDomainUpdated}`
    );
    mapSort1.forEach((k, v) => {
      console.log(`${v} : ${k} pages updated`);
    });
    delete minuteMap[currLogMinute];
    currLogMinute += 1;
    if (currLogMinute == 60) {
      currLogMinute = 1;
    }
  };

  setInterval(() => {
    console.log(
      "\n ============================ One Min Domain Report ============================ \n"
    );
    generateOneMinReport();
  }, 60000);
};

module.exports = DomainReport;
