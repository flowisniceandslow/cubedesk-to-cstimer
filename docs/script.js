function getSolveBounds(sessionSolves, sessionId, isOldest) {
  const newestSorted = sessionSolves.sort(
    (a, b) => a.started_at - b.started_at
  );
  const finalSorted = isOldest ? newestSorted.reverse() : newestSorted;
  return Math.floor(finalSorted[0].started_at / 1000);
}

function sessionIdToSolvesKey(cubeDeskData, sessionId) {
  for (const session of cubeDeskData.sessions) {
    if (session.id === sessionId) {
      return `session${session.order + 1}`;
    }
  }
}

function convertData(cubeDeskData) {
  const csTimerData = {
    properties: {
      sessionData: {},
      sessionN: cubeDeskData.sessions.length,
      session: 1,
    },
  };

  for (const session of cubeDeskData.sessions) {
    csTimerData[`session${session.order + 1}`] = [];
    const sessionSolves = cubeDeskData.solves.filter(
      (solve) => solve.session_id === session.id
    );
    csTimerData.properties.sessionData[(session.order + 1).toString()] = {
      name: session.name,
      opt: {},
      stat:
        sessionSolves.length === 0 ? [0, 0, -1] : [sessionSolves.length, 0, 0],
      date:
        sessionSolves.length === 0
          ? [null, null]
          : [
              getSolveBounds(sessionSolves, session.id, false),
              getSolveBounds(sessionSolves, session.id, true),
            ],
    };
  }

  for (const solve of cubeDeskData.solves) {
    csTimerData[sessionIdToSolvesKey(cubeDeskData, solve.session_id)].push([
      [
        solve.dnf ? -1 : solve.plus_two ? 2000 : 0,
        Math.floor(solve.raw_time * 1000),
      ],
      solve.scramble,
      (solve.notes ?? "").replace("\n", " "),
      Math.floor(solve.started_at / 1000),
    ]);
  }

  csTimerData.properties.sessionData = JSON.stringify(
    csTimerData.properties.sessionData
  );

  return csTimerData;
}

//https://stackoverflow.com/a/37430241
function readCubeDeskFile(evt) {
  return new Promise((resolve, reject) => {
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0];

    if (f) {
      var r = new FileReader();
      r.onload = function (e) {
        var contents = e.target.result;
        resolve(contents);
      };
      r.readAsText(f);
    } else {
      reject("Failed to load file");
    }
  });
}

document.getElementById("cubeDeskFile").addEventListener(
  "change",
  async (event) => {
    try {
      const fileContents = await readCubeDeskFile(event);
      const csTimerData = convertData(JSON.parse(fileContents));
      download(
        JSON.stringify(csTimerData),
        `converted_cstimer_${Date.now()}.txt`,
        "text/plain"
      );
    } catch (e) {
      console.error(e);
      alert(
        "Error! Please submit a Github issue with the logs from the console as well as your CubeDesk file!"
      );
    }
  },
  false
);
