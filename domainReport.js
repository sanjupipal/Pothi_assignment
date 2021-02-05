const { midnightblue } = require("color-name");

const DomainReport = () => {
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
  const domain = new Map();
  const domainForFiveMin = new Map();
  eventSource.onmessage = function (event) {
    event = JSON.parse(event.data);
    if (domain.has(event.meta.domain)) {
      domain.get(event.meta.domain).add(event.page_id);
    } else {
      let page = new Set();
      page.add(event.page_id);
      domain.set(event.meta.domain, page);
    }
    if (domainForFiveMin.has(event.meta.domain)) {
      domainForFiveMin.get(event.meta.domain).add(event.page_id);
    } else {
      let pages = new Set();
      pages.add(event.page_id);
      domainForFiveMin.set(event.meta.domain, pages);
    }
  };

  var countOfTime = 0;
  const generateOneMinReport = () => {
    let report = new Map();
    domain.forEach((k, v) => {
      report.set(v, k.size);
    });
    domain.clear();
    const mapSort1 = new Map([...report.entries()].sort((a, b) => b[1] - a[1]));
    let total = mapSort1.size;
    console.log(
      "\x1b[35m",
      `total number of Wikipedia Domain Updated : ${total}`
    );
    mapSort1.forEach((k, v) => {
      console.log("\x1b[44m", `${v} : ${k} pages updated`);
    });
  };

  const generateFiveMinReport = () => {
    let report = new Map();
    domainForFiveMin.forEach((k, v) => {
      report.set(v, k.size);
    });
    domainForFiveMin.clear();
    const mapSort1 = new Map([...report.entries()].sort((a, b) => b[1] - a[1]));
    let total = mapSort1.size;
    console.log(
      "\x1b[35m",
      `total number of Wikipedia Domain Updated : ${total}`
    );
    mapSort1.forEach((k, v) => {
      console.log("\x1b[44m", `${v} : ${k} pages updated`);
    });
  };

  setInterval(() => {
    countOfTime++;
    if (countOfTime == 5) {
      countOfTime = 0;
      console.log(
        "\x1b[31m",
        "\n ============================ Five Min Domain Report ============================ \n"
      );
      generateFiveMinReport();
    } else {
      console.log(
        "\x1b[31m",
        "\n ============================ One Min Domain Report ============================ \n"
      );
      generateOneMinReport();
    }
  }, 6000);
};

module.exports = DomainReport;
