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

/**
 * Fetch all players who cast "Death Wish" in a single report.
 * Steps:
 *  1. Retrieve all fight IDs in the report.
 *  2. Fetch structured eventsData for those fights, filtered to cast events of Death Wish.
 *  3. Extract and return the unique caster names.
 */
export async function fetchDeathwishCasters(reportCode) {
  console.log(`[fetchDeathwishCasters] Fetching fight IDs for report: ${reportCode}`);
  const fightsQuery = `
    query GetReportFights($code: String!) {
      reportData {
        report(code: $code) {
          fights { id }
        }
      }
    }
  `;
  const { report: fightsData } = await executeQuery(fightsQuery, { code: reportCode });
  const fightIDs = fightsData.fights.map(f => f.id);
  console.log(`[fetchDeathwishCasters] Found fights:`, fightIDs);
  if (!fightIDs.length) return [];

  console.log('[fetchDeathwishCasters] Fetching Death Wish events via abilityID filter');
  // Use the built‑in abilityID arg rather than filterExpression
  const eventsQuery = `
    query GetDeathwishEvents($code: String!, $fightIDs: [Int]!) {
      reportData {
        report(code: $code) {
          events(
            fightIDs: $fightIDs
            abilityID: 12328     # Death Wish
            limit: 10000
          ) {
            data
          }
        }
      }
    }
  `;
  const { report } = await executeQuery(eventsQuery, { code: reportCode, fightIDs });
  const raw = report.events.data;

  // `data` may come back as a JSON string or already‐parsed array:
  let rows = Array.isArray(raw) ? raw : JSON.parse(raw);

  console.log('[fetchDeathwishCasters] Total rows:', rows.length);

  // In the legacy CSV rows, column 3 is sourceName
  const casters = Array.from(new Set(
    rows
      // Optional: verify it's a cast event, too (column 1 is the event type)
      .filter(r => r[1] === 'cast')
      .map(r => r[3])
      .filter(Boolean)
  ));

  console.log('[fetchDeathwishCasters] Unique casters:', casters);
  return casters;
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
