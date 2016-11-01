var app = angular
  .module('app', ['appControllers','appServices','appFilters', 'spotify'])
  .config(function (SpotifyProvider) {
    SpotifyProvider.setClientId(config.spotify.clientId);
    SpotifyProvider.setRedirectUri(config.spotify.redirectUri);
    SpotifyProvider.setScope('playlist-read-private playlist-read-collaborative');
    if (localStorage.getItem('spotify-token'))
      SpotifyProvider.setAuthToken(localStorage.getItem('spotify-token'));
  });
var appControllers = angular.module('appControllers', []);
var appServices = angular.module('appServices', []);
var appFilters = angular.module('appFilters', []);

appControllers.controller('MainController', [ '$scope', 'Spotify', function ($scope, Spotify) {

  // Getting Spotify token from URL
  var hash = window.location.hash;
  if (window.location.search.substring(1).indexOf("error") !== -1) {}
  else if (hash) {
    var token = window.location.hash.split('&')[0].split('=')[1];
    localStorage.setItem('spotify-token', token);
  }

  // Getting Spotify token from local storage
  $scope.spotifyToken = localStorage.getItem('spotify-token');

  if ($scope.spotifyToken)
    loadSpotifyData();

  $scope.spotifyLogin = function () {
    Spotify.login()
      .then(function (data) {
        loadSpotifyData();
      });
  };

  $scope.spotifyUser = null;
  $scope.spotifyPlaylists = null;
  $scope.selectedPlaylist = { playlist: "" };
  function loadSpotifyData() {
    Spotify.getCurrentUser().then(function(data) {
      $scope.spotifyUser = data;
      loadSpotifyPlaylists();
    });
  }

  function loadSpotifyPlaylists() {
    Spotify.getUserPlaylists($scope.spotifyUser.id, { limit: 50 }).then(function(data) {
      $scope.spotifyPlaylists = data;
    });
  }

  $scope.convert = function() {
    if ($scope.selectedPlaylist.playlist != "") {
      console.log("Converting Spotify playlist " + $scope.selectedPlaylist.playlist.id);

      Spotify.getPlaylistTracks($scope.selectedPlaylist.playlist.owner.id, $scope.selectedPlaylist.playlist.id, {})
      .then(function(data) {
        $scope.songs = data;
        console.log(data);
      });
    }
  };



}]);
