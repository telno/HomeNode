property searchValue : "daft"

tell application "iTunes"
	set searchResults to (search library playlist 1 for searchValue only artists)
	if length of searchResults > 0 then
		set matchingPlaylists to every user playlist whose name is "ScriptedRequest"
		repeat with matchingPlaylist in matchingPlaylists
			delete matchingPlaylist
		end repeat
		set newPlaylist to (make new playlist with properties {name:"ScriptedRequest"})
		repeat with t in searchResults
			duplicate t to newPlaylist
		end repeat
		reveal newPlaylist
		set mute to false
		play newPlaylist
		return "queued " & (length of searchResults) & " tracks for playback at " & (get sound volume) & "% volume"
	else
		return "no results for that search"
	end if
end tell

