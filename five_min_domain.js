const FiveMin = () => {
  var EventSource = require("eventsource");
  var url = "https://stream.wikimedia.org/v2/stream/revision-create";

  var eventSource = new EventSource(url);

  eventSource.onerror = function (event) {
    console.error("--- Encountered error", event);
  };

  eventSource.onmessage = (event) => {
    event = JSON.parse(event.data);
    oneMinuteHandler(event);
  };

  const minuteMap = {};
  let currLogMinute = null;

  function oneMinuteHandler(event) {
    minute = Math.floor(new Date().getTime() / (60 * 1000)); //epoch minutes
    if (!currLogMinute) {
      currLogMinute = minute;
    }
    if (!minuteMap[minute]) {
      minuteMap[minute] = new Map();
    }
    domain = minuteMap[minute];
    if (domain.has(event.meta.domain)) {
      if (domain.get(event.meta.domain).has(event.page_id)) {
        count = domain.get(event.meta.domain).get(event.page_id);
        domain.get(event.meta.domain).set(event.page_id, count + 1);
      } else {
        domain.get(event.meta.domain).set(event.page_id, 1);
      }
    } else {
      let page = new Map();
      page.set(event.page_id, 1);
      domain.set(event.meta.domain, page);
    }
  }

  const ans = new Map();
  const generateOneMinReport = () => {
    data = minuteMap[currLogMinute];
    data.forEach((pageMap, domain) => {
      pageMap.forEach((count, page) => {
        if (ans.has(domain)) {
          if (ans.get(domain).has(page)) {
            count = ans.get(domain).get(page);
            ans.get(domain).set(page, count + 1);
          } else {
            ans.get(domain).set(page, 1);
          }
        } else {
          let p = new Map();
          p.set(page, 1);
          ans.set(domain, p);
        }
      });
    });
    if (minuteMap[currLogMinute - 5]) {
      data = minuteMap[currLogMinute - 5];
      data.forEach((pageMap, domain) => {
        pageMap.forEach((count, page) => {
          if (ans.has(domain)) {
            if (ans.get(domain).has(page)) {
              count = ans.get(domain).get(page);
              if (count > 1) {
                ans.get(domain).set(page, count - 1);
              } else {
                ans.get(domain).delete(page);
              }
            }
            if (ans.get(domain).size == 0) {
              ans.delete(domain);
            }
          }
        });
      });
      minuteMap.delete(currLogMinute - 5);
    }

    let report = new Map();
    ans.forEach((pageMap, domain) => {
      report.set(domain, pageMap.size);
    });
    const mapSort1 = new Map([...report.entries()].sort((a, b) => b[1] - a[1]));
    let totalDomainUpdated = mapSort1.size;
    console.log(
      `total number of Wikipedia Domain Updated : ${totalDomainUpdated}`
    );
    mapSort1.forEach((k, v) => {
      console.log(`${v} : ${k} pages updated`);
    });

    currLogMinute += 1;
  };

  setInterval(() => {
    minute = Math.floor(new Date().getTime() / (60 * 1000)); //epoch minutes
    if (minute == currLogMinute) {
      return;
    }
    console.log(
      "\n ============================ Five Min Domain Report ============================ \n"
    );
    generateOneMinReport();
  }, 60 * 1000);
};

module.exports = FiveMin;
