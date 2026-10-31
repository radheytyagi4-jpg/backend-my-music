
import asyncHandler from "../utilis/asyncHandler.js";
import ApiError from "../utilis/apiError.js";
import ApiResponse from "../utilis/apiResponse.js";

const fetchSongs = async (query) => {
  const API_URL = process.env.api || process.env.api;

  if (!API_URL) {
    throw new ApiError(500, "Saavn API URL is missing");
  }

  const response = await fetch(
    `${API_URL}${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new ApiError(502, "Saavn API request failed");
  }

  const data = await response.json();

  if (data?.status === false) {
    throw new ApiError(404, data.error || "Songs not found");
  }

  const songList = Array.isArray(data)
    ? data
    : Array.isArray(data?.songs)
    ? data.songs
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.results)
    ? data.results
    : data?.media_url
    ? [data]
    : [];

  return songList
    .filter((song) => song?.media_url)
    .map((song, index) => ({
      id: String(song.id || song.songid || song.e_songid || index),
      tittle: song.song || song.tittle,
      artist:
        song.primary_artists ||
        song.singers ||
        song.artist ||
        song.music ||
        "Unknown Artist",
      album: song.album || "",
      img: song.image || song.image_url || null,
      audioUrl: song.media_url,
      previewUrl: song.media_preview_url || null,
      duration: Number(song.duration) || 0,
      quality:
        song["320kbps"] === "true" ? "320kbps" : "160kbps",
    }));
};

export const songSearch = asyncHandler(async (req, res) => {
  const q = req.query.q?.trim();

  if (!q) {
    throw new ApiError(400, "Search query is required");
  }

  const songs = await fetchSongs(q);

  return res.status(200).json(
    new ApiResponse(200, songs, "Songs fetched successfully")
  );
});


const ARTISTS = [
  // Hindi and Bollywood
  "Arijit Singh",
  "Shreya Ghoshal",
  "Sonu Nigam",
  "KK",
  "Atif Aslam",
  "Mohit Chauhan",
  "Jubin Nautiyal",
  "Armaan Malik",
  "Vishal Mishra",
  "Pritam",
  "Ar Rahman",
  "Shankar Mahadevan",
  "Sunidhi Chauhan",
  "Neha Kakkar",
  "Darshan Raval",
  "B Praak",
  "Sachet Tandon",
  "Ankit Tiwari",
  "Palak Muchhal",
  "Rahat Fateh Ali Khan",

  // Punjabi artists
  "Karan Aujla",
  "Diljit Dosanjh",
  "Sidhu Moose Wala",
  "AP Dhillon",
  "Shubh",
  "Badshah",
  "Yo Yo Honey Singh",
  "Guru Randhawa",
  "Babbu Maan",
  "Gurdas Maan",
  "Amrinder Gill",
  "Jass Manak",
  "Garry Sandhu",
  "Parmish Verma",
  "Ranjit Bawa",
  "Ninja",
  "Sartaj Virk",
  "Talwiinder",
  "Dandha Nyoliwala",
  "Mankirt Aulakh",
  "Jordan Sandhu",
  "Harrdy Sandhu",
  "Prem Dhillon",

  // Indian Indie and independent artists
  "Anuv Jain",
  "Prateek Kuhad",
  "Ritviz",
  "The Local Train",
  "When Chai Met Toast",
  "Taba Chake",
  "Achint",
  "Aditya Rikhari",
  "The Yellow Diary",
  "Mitraz",
  "Raghav Meattle",
  "Zaeden",
  "King",
  "MC Stan",
  "Divine",
  "Emiway Bantai",
  "KR$NA",
  "Seedhe Maut",
  "Raftaar",
  "Ikka",
  "Fotty Seven",

  // International artists
  "The Weeknd",
  "Ed Sheeran",
  "Adele",
  "Imagine Dragons",
  "Dua Lipa",
  "Harry Styles",
  "Taylor Swift",
  "Billie Eilish",
  "Coldplay",
  "Bruno Mars",
  "Post Malone",
  "Rihanna",
  "Drake",
  "Ariana Grande",
  "Maroon 5",
  "Linkin Park",
  "Eminem",
  "Sia",
  "Shawn Mendes",
  "Charlie Puth",
  "Lana Del Rey",
  "Arctic Monkeys",
  "Olivia Rodrigo",
  "Sam Smith",
  "Justin Bieber",
  "Selena Gomez",
  "Katy Perry",
  "Lady Gaga",
  "Kendrick Lamar",
  "The Chainsmokers",
  "Calvin Harris",
  "Avicii",
  "Alan Walker",
  "Doja Cat",
  "SZA",
  "Travis Scott",
  "Khalid",
  "Lewis Capaldi",
  "Camila Cabello",
  "Justin Timberlake",
  "The Neighbourhood",
  "OneRepublic",
  "Shakira",
  "Beyonce",
  "John Mayer",
  "Lauv",
  "Tate McRae",
  "Frank Ocean",
  "Tyler The Creator",

  // Genre and category searches
  "rap",
  "hip hop",
  "bollywood",
  "punjabi",
  "indie",
  "romantic songs",
  "lofi",
  "sad songs",
  "pop music",
  "workout music",
  "EDM",
  "90s Bollywood",
];


export const discoverSongs = asyncHandler(async (req, res) => {
  const requestedCount = Number.parseInt(req.query.count, 10);

  const count = Number.isNaN(requestedCount)
    ? 12
    : Math.min(Math.max(requestedCount, 1), 20);

  const shuffled = [...ARTISTS];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selectedArtists = shuffled.slice(0, count);

  const results = await Promise.all(
    selectedArtists.map(async (artist) => {
      try {
        const songs = await fetchSongs(artist);
        return songs[0] || null;
      } catch (error) {
        console.error(`Failed to fetch ${artist}:`, error.message);
        return null;
      }
    })
  );

  const songs = results.filter(Boolean);

  return res.status(200).json(
    new ApiResponse(200, songs, "Songs discovered successfully")
  );
});
