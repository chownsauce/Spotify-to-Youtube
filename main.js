var app = angular
  .module('app', ['appControllers','appServices','appFilters', 'spotify', 'angular-google-gapi'])
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

appControllers.controller('MainController', [ '$scope', 'Spotify', 'GAuth', 'GData', 'GApi', function ($scope, Spotify, GAuth, GData, GApi) {

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

  // Getting Google token from local storage
  $scope.googleToken = localStorage.getItem('google-token');
  $scope.youtubeUser = null;

  GAuth.setClient(config.youtube.clientId);
  GAuth.setScope(config.youtube.scope);
  GApi.load('youtube', 'v3');

  if ($scope.googleToken) {
    GAuth.setToken({ access_token: $scope.googleToken }).then(function() {
      $scope.youtubeUser = GData.getUser();
    });
  }

  $scope.youtubeLogin = function() {
    GAuth.login().then(function(user) {
      console.log(user);
      $scope.youtubeUser = user;
      GAuth.getToken().then(function(d) {
        localStorage.setItem('google-token', d.access_token);
      });
    }, function() {
        console.log('login failed');
    });
  };

  $scope.videos = [];
  $scope.playlist = null;
  function afterSongLoading() {
    GApi.execute(
      'youtube',
      'playlists.insert',
      {
        part: "snippet,status",
        snippet: {
          title: $scope.selectedPlaylist.playlist.name
        },
        status: {
          privacyStatus: 'private'
        }
      }
    ).then(function(resp) {
      $scope.playlist = resp.result;
      console.log(resp);
      pushSong(0);
    }, function(e) {
      console.log('error :(');
      console.log(e);
    });
  }

  function afterSongPush() {
    console.log('Voila');
  }

  function pushSong(index) {
    if (index >= $scope.videos.length || index >= 50)
      return afterSongPush();
    GApi.execute(
      'youtube',
      'playlistItems.insert',
      {
        part: "snippet",
        resource: {
          snippet: {
            playlistId: $scope.playlist.id,
            resourceId: {
              videoId: $scope.videos[index],
              kind: 'youtube#video'
            }
          }
        }
      }
    ).then(function(resp) {
      pushSong(index + 1);
    }, function() {
        console.log('error :(');
    });
  }

  function loadSong(index) {
    if (index >= $scope.songs.length || index >= 50)
      return afterSongLoading();
    GApi.execute('youtube', 'search.list', { part: "id,snippet", q: $scope.songs[index].track.name + " " + $scope.songs[index].track.artists[0].name }).then(function(resp) {
      console.log(resp);
      if (resp.items.length)
        $scope.videos.push(resp.items[0].id.videoId);
      loadSong(index + 1);
    }, function() {
      console.log('error :(');
    });
  }

  $scope.convert = function() {
    if ($scope.selectedPlaylist.playlist != "") {
      console.log("Converting Spotify playlist " + $scope.selectedPlaylist.playlist.id);

      Spotify.getPlaylistTracks($scope.selectedPlaylist.playlist.owner.id, $scope.selectedPlaylist.playlist.id, {})
      .then(function(data) {
        $scope.songs = data.items;
        console.log(data);
        loadSong(0);
      });
    }
  };

}]);
