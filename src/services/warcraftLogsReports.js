// src/services/warcraftLogsReports.js

const API_URL = 'https://www.warcraftlogs.com/api/v2/client';

async function executeQuery(query, variables) {
  const token = sessionStorage.getItem('access_token');
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors.map(e => e.message).join(', '));
  }
  return json.data.reportData;
}

/**
 * Fetch paged reports for a given user ID.
 */
export async function fetchUserReports(userId, { limit = 20, page = 1 } = {}) {
  const query = `
    query GetMyReports($userId: Int!, $limit: Int!, $page: Int!) {
      reportData {
        reports(userID: $userId, limit: $limit, page: $page) {
          total
          hasMorePages: has_more_pages
          data {
            code
            title
            startTime
            endTime
            visibility
            zone { name }
          }
        }
      }
    }
  `;

  const { reports } = await executeQuery(query, { userId, limit, page });
  return reports;
}

// src/services/warcraftLogsReports.js
// src/services/warcraftLogsReports.js

/**
 * Fetch all cast events for Death Wish, Recklessness, and Diamond Flask,
 * annotated with absoluteTimestamp, abilityGameID, sourceName, and encounterName.
 */
export async function fetchCasts(reportCode) {
  // 1) Get fight IDs + encounter names + report startTime
  const metaQ = `
    query GetReportMeta($code: String!) {
      reportData {
        report(code: $code) {
          startTime
          fights {
            id
            name        # encounter (boss) name
          }
        }
      }
    }
  `;
  const metaResp = await executeQuery(metaQ, { code: reportCode });
  const report = metaResp.report;
  const startTime = report?.startTime;
  const fights = report?.fights || [];

  if (!startTime || !fights.length) return [];

  // build fightId → encounterName map
  const fightIdToName = Object.fromEntries(
    fights.map(f => [f.id, f.name || "Unknown encounter"])
  );

  const fightIDs = fights.map(f => f.id);

  // 2) Fetch only the three abilities server‑side
  const eventsQ = `
    query GetKeyCastEvents($code: String!, $fightIDs: [Int]!) {
      reportData {
        report(code: $code) {
          events(
            fightIDs: $fightIDs
            filterExpression: "type = \\"cast\\" and (ability.id = 12328 or ability.id = 1719 or ability.id = 363880)"
            limit: 10000
          ) {
            data
          }
        }
      }
    }
  `;
  const eventsResp = await executeQuery(eventsQ, { code: reportCode, fightIDs });
  let rows = eventsResp.report?.events?.data;
  if (!rows) return [];

  // 3) Parse JSON if needed
  if (typeof rows === "string") {
    try { rows = JSON.parse(rows); }
    catch {
      console.error("[fetchKeyCastEvents] Failed to parse events JSON");
      return [];
    }
  }

  // 4) Fetch actor names
  const actorsQ = `
    query GetActors($code: String!) {
      reportData {
        report(code: $code) {
          masterData {
            actors { id name }
          }
        }
      }
    }
  `;
  const actorsResp = await executeQuery(actorsQ, { code: reportCode });
  const actors = actorsResp.report?.masterData?.actors || [];
  const idToName = {};
  for (const a of actors) {
    if (typeof a.id === "number" && typeof a.name === "string") {
      idToName[a.id] = a.name;
    }
  }

  // 5) Map each event to include absoluteTime + encounterName
  return rows.map(ev => ({
    absoluteTimestamp: startTime + ev.timestamp,
    sourceName:       idToName[ev.sourceID]        || "Unknown",
    abilityGameID:    ev.abilityGameID,
    encounterName:    fightIdToName[ev.fight]      || "Unknown encounter",
  }));
}




/**
 * Fetch paged reports for a given guild by its numeric ID.
 */
export async function fetchGuildReports({ guildID, limit = 20, page = 1 }) {
  const query = `
    query GetGuildReports($guildID: Int!, $limit: Int!, $page: Int!) {
      reportData {
        reports(guildID: $guildID, limit: $limit, page: $page) {
          total
          hasMorePages: has_more_pages
          data {
            code
            title
            startTime
            endTime
            visibility
            zone { name }
          }
        }
      }
    }
  `;

  const { reports } = await executeQuery(query, { guildID, limit, page });
  return reports;
}
