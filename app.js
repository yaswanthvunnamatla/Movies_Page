const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'moviesData.db')

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.error('DB Error: ${error.message}')
    process.exit(1)
  }
}
const convertMovieDbToResponse = dbObject => ({
  movieId: dbObject.movie_id,
  directorId: dbObject.director_id,
  movieName: dbObject.movie_name,
  leadActor: dbObject.lead_actor,
})

const convertDirectorDbToResponse = dbObject => ({
  directorId: dbObject.director_id,
  directorName: dbObject.director_name,
})

app.get('/movies/', async (request, response) => {
  const getMoviesQuery = `SELECT movie_name FROM movie`
  const moviesArray = await db.all(getMoviesQuery)
  response.send(moviesArray.map(movie => ({movieName: movie.movie_name})))
})

app.post('/movies/', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body
  const createMovieQuery = `
    INSERT INTO movie (director_id, movie_name, lead_actor)
    VALUES (${directorId},'${movieName}','${leadActor}')`
  await db.run(createMovieQuery)
  response.send('Movie Successfully Added')
})

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `SELECT * FROM movie WHERE movie_id = ${movieId}`
  const moviesArr = await db.get(getMovieQuery)
  response.send(convertMovieDbToResponse(moviesArr))
})

app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const {directorId, movieName, leadActor} = request.body
  const updateMovieQuery = `
    UPDATE movie
    SET director_id = ${directorId}, movie_name = '${movieName}', lead_actor = '${leadActor}'
    WHERE movie_id = ${movieId}`
  await db.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `DELETE FROM movie WHERE movie_id = ${movieId}`
  await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})

app.get('/directors/', async (request, response) => {
  const directorQuery = `
      SELECT * FROM director
  `
  const directorArray = await db.all(directorQuery)
  response.send(
    directorArray.map(director => convertDirectorDbToResponse(director)),
  )
})

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const movieQuery = `
      SELECT movie_name FROM movie WHERE director_id = ${directorId}
  `
  const movies = await db.all(movieQuery)

  response.send(movies.map(movie => ({movieName: movie.movie_name})))
})

initializeDBAndServer()

module.exports = app
