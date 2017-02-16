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

  $scope.convertedPlaylist = {
    name: "Playlist name on Youtube",
    progress: 0,
    loading: false,
    object: null,
    karaokeMode: false,
    videos: []
  };


  //
  // INITIALIZING SPOTIFY CLIENT
  //

  $scope.spotifyUser = null;

  // Getting Spotify token from URL
  var hash = window.location.hash;
  if (window.location.search.substring(1).indexOf("error") !== -1) {}
  else if (hash) {
    var token = window.location.hash.split('&')[0].split('=')[1];
    localStorage.setItem('spotify-token', token);
  }

  // Getting Spotify token from local storage
  $scope.spotifyToken = localStorage.getItem('spotify-token');

  // Loading user data from API
  if ($scope.spotifyToken)
    loadSpotifyData();


  //
  // INITIALIZING GOOGLE CLIENT
  //

  $scope.youtubeUser = null;

  // Getting Spotify token from URL
  $scope.googleToken = localStorage.getItem('google-token');

  GAuth.setClient(config.youtube.clientId);
  GAuth.setScope(config.youtube.scope);
  GApi.load('youtube', 'v3');

  // Loading Google user data
  if ($scope.googleToken) {
    GAuth.setToken({ access_token: $scope.googleToken }).then(
      function() {
        $scope.youtubeUser = GData.getUser();
      }
    );
  }


  //
  // LOGGING PROCEDURES
  //
  $scope.spotifyLogin = function () {
    Spotify.login().then(loadSpotifyData);
  };

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


  //
  // GETTING DATA FROM APIS
  //

  $scope.startingPlaylist = {
    list: null,
    selected: null,
  };

  function loadSpotifyData() {
    Spotify.getCurrentUser().then(function(data) {
      $scope.spotifyUser = data;
      loadSpotifyPlaylists();
    });
  }

  function loadSpotifyPlaylists() {
    Spotify.getUserPlaylists($scope.spotifyUser.id, { limit: 50 }).then(function(data) {
      $scope.startingPlaylist.list = data;
      $scope.startingPlaylist.selected = data.items[0];
      $scope.convertedPlaylist.name = data.items[0].name;
    });
  }

  $scope.updatePlaylistName = function() {
    $scope.convertedPlaylist.name = $scope.startingPlaylist.selected.name;
  }


  //
  // CONVERTING PLAYLIST
  //

  function afterSongLoading() {
    GApi.execute(
      'youtube',
      'playlists.insert',
      {
        part: "snippet,status",
        snippet: {
          title: $scope.convertedPlaylist.name
        },
        status: {
          privacyStatus: 'private'
        }
      }
    ).then(function(resp) {
      $scope.convertedPlaylist.object = resp.result;
      console.log(resp);
      pushSong(0);
    }, function(e) {
      console.log('error :(');
      console.log(e);
    });
  }

  function afterSongPush() {
    $scope.convertedPlaylist.progress = 100;
    $scope.convertedPlaylist.loading = false;
  }

  function pushSong(index) {
    if (index >= $scope.convertedPlaylist.videos.length || index >= 50)
      return afterSongPush();
    GApi.execute(
      'youtube',
      'playlistItems.insert',
      {
        part: "snippet",
        resource: {
          snippet: {
            playlistId: $scope.convertedPlaylist.object.id,
            resourceId: {
              videoId: $scope.convertedPlaylist.videos[index],
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
    GApi.execute('youtube', 'search.list', { part: "id,snippet", q: $scope.songs[index].track.name + " " + $scope.songs[index].track.artists[0].name + ($scope.convertedPlaylist.karaokeMode ? " karaoke" : "") }).then(function(resp) {
      console.log(resp);
      if (resp.items.length)
        $scope.convertedPlaylist.videos.push(resp.items[0].id.videoId);
      $scope.convertedPlaylist.progress += 100 / $scope.songs.length;
      loadSong(index + 1);
    }, function() {
      console.log('error :(');
    });
  }

  $scope.convert = function() {
    if ($scope.startingPlaylist.selected != "") {
      $scope.convertedPlaylist.loading = true;
      console.log("Converting Spotify playlist " + $scope.startingPlaylist.selected.id);

      Spotify.getPlaylistTracks($scope.startingPlaylist.selected.owner.id, $scope.startingPlaylist.selected.id, {})
      .then(function(data) {
        $scope.songs = data.items;
        console.log(data);
        loadSong(0);
      });
    }
  };

}]);
