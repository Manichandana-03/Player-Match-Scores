const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjToResObj = (dbObj) => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
   SELECT * FROM player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertDbObjToResObj(eachPlayer))
  );
});

//API 2
app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayerQuery = `
    SELECT * FROM player_details
    WHERE player_id = ${playerId};`;
  const specificPlayer = await db.get(getSpecificPlayerQuery);
  response.send(convertDbObjToResObj(specificPlayer));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updateQuery = `
  UPDATE player_details 
  SET 
   player_name = '${playerName}'
   WHERE player_id = ${playerId};`;
  const updatedPlayer = await db.run(updateQuery);
  response.send("Player Details Updated");
});

const convertDBToRes = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getSpecificMatchQuery = `
    SELECT * FROM match_details
    WHERE match_id = ${matchId};`;
  const specificMatch = await db.get(getSpecificMatchQuery);
  response.send(convertDBToRes(specificMatch));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
  SELECT 
  match_id as matchId,match,year 
  FROM 
  match_details
   NATURAL JOIN player_match_score
   WHERE player_id = ${playerId};`;
  const dbResponse = await db.all(getMatchesQuery);
  response.send(dbResponse);
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getSpecificPlayerFromGivenMatchQuery = `
      SELECT
       player_id as playerId,
       player_name as playerName
        FROM
         player_details 
         NATURAL JOIN player_match_score
         WHERE match_id = ${matchId};`;
  const specificPlayerRes = await db.all(getSpecificPlayerFromGivenMatchQuery);
  response.send(specificPlayerRes);
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const totalStatisticsQuery = `
     SELECT 
     player_details.player_id as playerId,
     player_details.player_name as playerName,
     SUM(player_match_score.score)AS totalScore,
     SUM(player_match_score.fours) AS totalFours,
     SUM(player_match_score.sixes) AS totalSixes
     FROM 
     player_details
      NATURAL JOIN player_match_score
      WHERE player_id = ${playerId};`;
  const dbResponse = await db.get(totalStatisticsQuery);
  response.send(dbResponse);
});

module.exports = app;
